import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type { PaginatedResult } from '../common/dto/paginated-response.dto';
import { FileStorageService } from '../file-storage/file-storage.service';
import { RoleEnum } from '../roles/roles.enum';
import { UsersService } from '../users/users.service';
import { ENROLLMENT_STATUS, PERIOD_STATUS } from './constants/enrollment-status';
import type { Enrollment } from './domain/enrollment';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import type { UpdateMastersDegreesDto } from './dto/masters-degree.dto';
import type { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import type { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentRepository } from './infrastructure/persistence/enrollment.repository';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly usersService: UsersService,
    private readonly enrollmentPeriodService: EnrollmentPeriodService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(userId: string, dto: CreateEnrollmentDto): Promise<Enrollment> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.role !== RoleEnum.candidate) {
      throw new ForbiddenException('Apenas candidatos podem criar inscrições.');
    }

    if (!user.onboardingCompleted) {
      throw new BadRequestException('É necessário completar o onboarding antes de se inscrever.');
    }

    const period = await this.enrollmentPeriodService.findById(dto.enrollmentPeriodId);

    if (period.status !== PERIOD_STATUS.OPEN) {
      throw new BadRequestException('O período de inscrição não está aberto.');
    }

    const existing = await this.enrollmentRepository.findByCandidateAndPeriod(
      userId,
      dto.enrollmentPeriodId,
    );

    if (existing) {
      throw new ConflictException('Já existe uma inscrição para este período.');
    }

    const enrollment = await this.enrollmentRepository.create({
      candidateId: userId,
      enrollmentPeriodId: dto.enrollmentPeriodId,
      level: dto.level,
      status: ENROLLMENT_STATUS.DRAFT,
    });

    this.logger.log(`Inscrição criada: ${enrollment.id} para usuário ${userId}`);
    return enrollment;
  }

  async findMine(userId: string): Promise<Enrollment[]> {
    return this.enrollmentRepository.findByCandidateId(userId);
  }

  async findById(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    return enrollment;
  }

  async findAll(filters: FindEnrollmentsDto): Promise<PaginatedResult<Enrollment>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    return this.enrollmentRepository.findAll({
      candidateId: filters.candidateId,
      enrollmentPeriodId: filters.enrollmentPeriodId,
      status: filters.status,
      level: filters.level,
      page,
      limit,
    });
  }

  async update(userId: string, id: string, dto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta inscrição.');
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser editadas.');
    }

    const period = await this.enrollmentPeriodService.findById(enrollment.enrollmentPeriodId);
    if (period.status !== PERIOD_STATUS.OPEN) {
      throw new BadRequestException('O período de inscrição não está mais aberto.');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.justification !== undefined) updateData.justification = dto.justification;
    if (dto.sigaaCode !== undefined) updateData.sigaaCode = dto.sigaaCode;
    if (dto.declaration !== undefined) updateData.declaration = dto.declaration;
    if (dto.poscomp !== undefined) updateData.poscomp = dto.poscomp;

    const updated = await this.enrollmentRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Inscrição atualizada: ${id}`);
    return updated;
  }

  async submit(userId: string, id: string): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para submeter esta inscrição.');
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser submetidas.');
    }

    const period = await this.enrollmentPeriodService.findById(enrollment.enrollmentPeriodId);
    if (period.status !== PERIOD_STATUS.OPEN) {
      throw new BadRequestException('O período de inscrição não está mais aberto.');
    }

    if (!enrollment.phone) {
      throw new BadRequestException('O campo telefone é obrigatório para submeter a inscrição.');
    }

    if (!enrollment.justification) {
      throw new BadRequestException(
        'O campo justificativa é obrigatório para submeter a inscrição.',
      );
    }

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      status: ENROLLMENT_STATUS.SUBMITTED,
      submittedAt: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Inscrição submetida: ${id} por ${userId}`);
    return updated;
  }

  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto): Promise<Enrollment> {
    await this.findById(id);

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      status: dto.status,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Status da inscrição ${id} atualizado para ${dto.status}`);
    return updated;
  }

  async updateMastersDegrees(
    userId: string,
    id: string,
    dto: UpdateMastersDegreesDto,
  ): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta inscrição.');
    }

    if (enrollment.level !== 'doctoral') {
      throw new BadRequestException(
        'Informações de mestrado são exclusivas para inscrições de doutorado.',
      );
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser editadas.');
    }

    const primaryCount = dto.mastersDegrees.filter(d => d.isPrimary).length;
    if (primaryCount !== 1) {
      throw new BadRequestException(
        'Exatamente um curso de mestrado deve ser marcado como principal.',
      );
    }

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      mastersDegrees: dto.mastersDegrees,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Informações de mestrado atualizadas: ${id}`);
    return updated;
  }

  async getMastersDegrees(id: string): Promise<Enrollment['mastersDegrees']> {
    const enrollment = await this.findById(id);
    return enrollment.mastersDegrees;
  }

  async cancel(userId: string, id: string): Promise<void> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para cancelar esta inscrição.');
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser canceladas.');
    }

    await this.enrollmentRepository.remove(id);

    this.logger.log(`Inscrição cancelada e removida: ${id}`);
  }

  async uploadSigaaReceipt(
    userId: string,
    id: string,
    file: Express.Multer.File,
  ): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta inscrição.');
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser editadas.');
    }

    if (enrollment.sigaaReceiptFileId) {
      await this.fileStorageService.delete(enrollment.sigaaReceiptFileId);
    }

    const fileRecord = await this.fileStorageService.upload(file, userId, 'sigaa-receipts');

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      sigaaReceiptFileId: fileRecord.id,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Comprovante SIGAA enviado para inscrição: ${id}`);
    return updated;
  }

  async getSigaaReceiptUrl(userId: string, id: string): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta inscrição.');
    }

    if (!enrollment.sigaaReceiptFileId) {
      throw new NotFoundException('Comprovante SIGAA não encontrado.');
    }

    const fileRecord = await this.fileStorageService.findById(enrollment.sigaaReceiptFileId);
    const url = await this.fileStorageService.getSignedDownloadUrl(enrollment.sigaaReceiptFileId);
    return { url, fileName: fileRecord.originalName };
  }

  async uploadPoscompReceipt(
    userId: string,
    id: string,
    file: Express.Multer.File,
  ): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta inscrição.');
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser editadas.');
    }

    const poscomp = enrollment.poscomp;
    if (!poscomp || !poscomp.hasPoscomp) {
      throw new BadRequestException('Preencha os dados do POSCOMP antes de enviar o comprovante.');
    }

    // Delete old receipt if exists
    if (poscomp.receiptFileId) {
      await this.fileStorageService.delete(poscomp.receiptFileId);
    }

    const fileRecord = await this.fileStorageService.upload(file, userId, 'poscomp-receipts');

    const updatedPoscomp = { ...poscomp, receiptFileId: fileRecord.id };
    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      poscomp: updatedPoscomp,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Comprovante POSCOMP enviado para inscrição: ${id}`);
    return updated;
  }

  async getPoscompReceiptUrl(
    userId: string,
    id: string,
  ): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta inscrição.');
    }

    const receiptFileId = enrollment.poscomp?.receiptFileId;
    if (!receiptFileId) {
      throw new NotFoundException('Comprovante POSCOMP não encontrado.');
    }

    const fileRecord = await this.fileStorageService.findById(receiptFileId);
    const url = await this.fileStorageService.getSignedDownloadUrl(receiptFileId);
    return { url, fileName: fileRecord.originalName };
  }
}
