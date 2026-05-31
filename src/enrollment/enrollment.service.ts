import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import type { PaginatedResult } from '../common/dto/paginated-response.dto';
import { buildPaginatedResult } from '../common/dto/paginated-response.dto';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import { enrollments } from '../database/schema/enrollments';
import { FileStorageService } from '../file-storage/file-storage.service';
import { RoleEnum } from '../roles/roles.enum';
import { UsersService } from '../users/users.service';
import { Enrollment } from './domain/enrollment';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import type { UpdateMastersDegreesDto } from './dto/masters-degree.dto';
import type { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import type { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { ENROLLMENT_STATUS } from './constants/enrollment-status';
import { PERIOD_STATUS } from './constants/enrollment-status';
import { EnrollmentPeriodService } from './enrollment-period.service';

import type { SQL } from 'drizzle-orm';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @Inject(DRIZZLE_TX) private readonly db: DrizzleDB,
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

    const [existing] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.candidateId, userId),
          eq(enrollments.enrollmentPeriodId, dto.enrollmentPeriodId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('Já existe uma inscrição para este período.');
    }

    const [row] = await this.db
      .insert(enrollments)
      .values({
        candidateId: userId,
        enrollmentPeriodId: dto.enrollmentPeriodId,
        level: dto.level,
        status: ENROLLMENT_STATUS.DRAFT,
      })
      .returning();

    this.logger.log(`Inscrição criada: ${row.id} para usuário ${userId}`);
    return Enrollment.toDomain(row);
  }

  async findMine(userId: string): Promise<Enrollment[]> {
    const rows = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.candidateId, userId));

    return rows.map(row => Enrollment.toDomain(row));
  }

  async findById(id: string): Promise<Enrollment> {
    const [row] = await this.db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);

    if (!row) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    return Enrollment.toDomain(row);
  }

  async findAll(filters: FindEnrollmentsDto): Promise<PaginatedResult<Enrollment>> {
    const conditions: SQL[] = [];
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    if (filters.candidateId) {
      conditions.push(eq(enrollments.candidateId, filters.candidateId));
    }
    if (filters.enrollmentPeriodId) {
      conditions.push(eq(enrollments.enrollmentPeriodId, filters.enrollmentPeriodId));
    }
    if (filters.status) {
      conditions.push(
        eq(enrollments.status, filters.status as 'draft' | 'submitted' | 'closed' | 'cancelled'),
      );
    }
    if (filters.level) {
      conditions.push(eq(enrollments.level, filters.level as 'masters' | 'doctoral'));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(enrollments)
      .where(whereClause)
      .orderBy(enrollments.createdAt)
      .limit(limit)
      .offset(offset);

    const [totalRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(whereClause);

    return buildPaginatedResult({
      data: rows.map(row => Enrollment.toDomain(row)),
      page,
      limit,
      total: totalRow?.count ?? 0,
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

    const [row] = await this.db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, id))
      .returning();

    this.logger.log(`Inscrição atualizada: ${id}`);
    return Enrollment.toDomain(row);
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
    const [row] = await this.db
      .update(enrollments)
      .set({
        status: ENROLLMENT_STATUS.SUBMITTED,
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(enrollments.id, id))
      .returning();

    this.logger.log(`Inscrição submetida: ${id} por ${userId}`);
    return Enrollment.toDomain(row);
  }

  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto): Promise<Enrollment> {
    await this.findById(id);

    const now = new Date();
    const [row] = await this.db
      .update(enrollments)
      .set({
        status: dto.status as 'submitted' | 'closed' | 'cancelled',
        updatedAt: now,
      })
      .where(eq(enrollments.id, id))
      .returning();

    this.logger.log(`Status da inscrição ${id} atualizado para ${dto.status}`);
    return Enrollment.toDomain(row);
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
    const [row] = await this.db
      .update(enrollments)
      .set({
        mastersDegrees: dto.mastersDegrees,
        updatedAt: now,
      })
      .where(eq(enrollments.id, id))
      .returning();

    this.logger.log(`Informações de mestrado atualizadas: ${id}`);
    return Enrollment.toDomain(row);
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

    await this.db.delete(enrollments).where(eq(enrollments.id, id));

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
    const [row] = await this.db
      .update(enrollments)
      .set({
        sigaaReceiptFileId: fileRecord.id,
        updatedAt: now,
      })
      .where(eq(enrollments.id, id))
      .returning();

    this.logger.log(`Comprovante SIGAA enviado para inscrição: ${id}`);
    return Enrollment.toDomain(row);
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
    const [row] = await this.db
      .update(enrollments)
      .set({
        poscomp: updatedPoscomp,
        updatedAt: now,
      })
      .where(eq(enrollments.id, id))
      .returning();

    this.logger.log(`Comprovante POSCOMP enviado para inscrição: ${id}`);
    return Enrollment.toDomain(row);
  }

  async getPoscompReceiptUrl(userId: string, id: string): Promise<{ url: string; fileName: string }> {
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

