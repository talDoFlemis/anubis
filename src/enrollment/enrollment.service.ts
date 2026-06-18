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
import { MailService } from '../mail/mail.service';
import { ResearchThemeService } from '../research-theme/research-theme.service';
import { RoleEnum } from '../roles/roles.enum';
import { User } from '../users/domain/user';
import { UsersService } from '../users/users.service';
import { ENROLLMENT_STATUS, PERIOD_STATUS } from './constants/enrollment-status';
import type { Enrollment } from './domain/enrollment';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import type { UpdateMastersDegreesDto } from './dto/masters-degree.dto';
import type { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { UpdateEnrollmentThemesDto } from './dto/update-enrollment-themes.dto';
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
    private readonly researchThemeService: ResearchThemeService,
    private readonly mailService: MailService,
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
    if (dto.undergradUniversity !== undefined)
      updateData.undergradUniversity = dto.undergradUniversity;
    if (dto.undergradCourse !== undefined) updateData.undergradCourse = dto.undergradCourse;
    if (dto.undergradDegreeType !== undefined)
      updateData.undergradDegreeType = dto.undergradDegreeType;
    if (dto.ira !== undefined) updateData.ira = dto.ira;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.justification !== undefined) updateData.justification = dto.justification;
    if (dto.sigaaCode !== undefined) updateData.sigaaCode = dto.sigaaCode;
    if (dto.declaration !== undefined) updateData.declaration = dto.declaration;
    if (dto.poscomp !== undefined) updateData.poscomp = dto.poscomp;
    if (dto.projectTitle !== undefined) updateData.projectTitle = dto.projectTitle;

    const updated = await this.enrollmentRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Inscrição atualizada: ${id}`);
    return updated;
  }

  async updateThemes(
    userId: string,
    id: string,
    dto: UpdateEnrollmentThemesDto,
  ): Promise<Enrollment> {
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

    const secondaryThemeId = dto.secondaryThemeId ?? null;

    if (secondaryThemeId !== null && dto.primaryThemeId === secondaryThemeId) {
      throw new BadRequestException('Os temas primário e secundário devem ser diferentes.');
    }

    const primaryTheme = await this.researchThemeService.findById(dto.primaryThemeId);
    if ((primaryTheme.level as string) !== enrollment.level) {
      throw new BadRequestException(
        'Os temas selecionados devem ser compatíveis com o nível da inscrição.',
      );
    }

    if (secondaryThemeId !== null) {
      const secondaryTheme = await this.researchThemeService.findById(secondaryThemeId);
      if ((secondaryTheme.level as string) !== enrollment.level) {
        throw new BadRequestException(
          'Os temas selecionados devem ser compatíveis com o nível da inscrição.',
        );
      }
    }

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      primaryThemeId: dto.primaryThemeId,
      secondaryThemeId,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Temas da inscrição atualizados: ${id}`);
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

    const errors: string[] = [];

    if (!enrollment.undergradUniversity) {
      errors.push('A universidade de graduação é obrigatória.');
    }
    if (!enrollment.undergradCourse) {
      errors.push('O curso de graduação é obrigatório.');
    }
    if (!enrollment.undergradDegreeType) {
      errors.push('O tipo de graduação é obrigatório.');
    }
    if (!enrollment.ira) {
      errors.push('O IRA é obrigatório.');
    }
    if (!enrollment.undergradProofFileId) {
      errors.push('O comprovante de conclusão da graduação é obrigatório.');
    }
    if (!enrollment.phone) {
      errors.push('O campo telefone é obrigatório.');
    }
    if (!enrollment.justification) {
      errors.push('O campo justificativa é obrigatório.');
    }
    if (!enrollment.declaration) {
      errors.push('A declaração de veracidade é obrigatória.');
    }
    if (!enrollment.sigaaCode) {
      errors.push('O código SIGAA é obrigatório.');
    }
    if (!enrollment.sigaaReceiptFileId) {
      errors.push('O comprovante de inscrição do SIGAA é obrigatório.');
    }
    if (!enrollment.primaryThemeId) {
      errors.push('O tema primário é obrigatório.');
    }
    // Tema secundário é opcional: candidato pode optar por "Não desejo informar".

    if (enrollment.level === 'doctoral') {
      if (!enrollment.mastersDegrees || enrollment.mastersDegrees.length === 0) {
        errors.push(
          'Pelo menos um curso de mestrado deve ser informado para inscrições de doutorado.',
        );
      } else {
        const primaryCount = enrollment.mastersDegrees.filter(d => d.isPrimary).length;
        if (primaryCount !== 1) {
          errors.push('Exatamente um curso de mestrado deve ser marcado como principal.');
        }

        const missingIra = enrollment.mastersDegrees.some(
          d => d.ira === undefined || d.ira === null,
        );
        if (missingIra) {
          errors.push('O IRA de cada curso de mestrado é obrigatório.');
        }

        const missingProof = enrollment.mastersDegrees.some(d => !d.proofFileId);
        if (missingProof) {
          errors.push('O comprovante do IRA de cada curso de mestrado é obrigatório.');
        }
      }

      if (!enrollment.projectTitle) {
        errors.push('O título do projeto é obrigatório para inscrições de doutorado.');
      }
      if (!enrollment.projectFileId) {
        errors.push('O arquivo PDF do projeto é obrigatório para inscrições de doutorado.');
      }
    }

    if (enrollment.poscomp && enrollment.poscomp.hasPoscomp) {
      const poscomp = enrollment.poscomp;
      if (!poscomp.year) {
        errors.push('O ano do POSCOMP é obrigatório.');
      }
      if (poscomp.mathScore === undefined || poscomp.mathScore === null) {
        errors.push('A nota de Matemática do POSCOMP é obrigatória.');
      }
      if (poscomp.fundamentalsScore === undefined || poscomp.fundamentalsScore === null) {
        errors.push('A nota de Fundamentos do POSCOMP é obrigatória.');
      }
      if (poscomp.technologyScore === undefined || poscomp.technologyScore === null) {
        errors.push('A nota de Tecnologia do POSCOMP é obrigatória.');
      }
      if (!poscomp.receiptFileId) {
        errors.push('O comprovante do POSCOMP é obrigatório.');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
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

    const user = await this.usersService.findById(userId);
    if (user && user.email) {
      try {
        const primaryTheme = await this.researchThemeService.findById(updated.primaryThemeId!);
        const secondaryThemeTitle = updated.secondaryThemeId
          ? (await this.researchThemeService.findById(updated.secondaryThemeId)).title
          : 'Não informado';

        const title = 'Inscrição Submetida com Sucesso - MDCC';
        const body = `
          <p>Olá, ${user.firstName} ${user.lastName},</p>
          <p>Sua inscrição no processo seletivo do MDCC foi submetida com sucesso!</p>
          <p><strong>Detalhes da inscrição:</strong></p>
          <ul>
            <li><strong>ID da Inscrição:</strong> ${id}</li>
            <li><strong>Nível:</strong> ${updated.level === 'masters' ? 'Mestrado' : 'Doutorado'}</li>
            <li><strong>Código SIGAA:</strong> ${updated.sigaaCode}</li>
            <li><strong>Tema de Pesquisa Primário:</strong> ${primaryTheme.title}</li>
            <li><strong>Tema de Pesquisa Secundário:</strong> ${secondaryThemeTitle}</li>
          </ul>
          <br/>
          <p>Atenciosamente,</p>
          <p>Coordenação do MDCC / UFC</p>
        `;
        await this.mailService.send({
          to: user.email,
          title,
          body,
        });
        this.logger.log(`E-mail de confirmação enviado para ${user.email} para a inscrição ${id}`);
      } catch (err) {
        this.logger.error(
          `Falha ao enviar e-mail de confirmação ou recuperar temas para a inscrição ${id}`,
          err,
        );
      }
    }

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

    // Gather file IDs to delete
    const fileIdsToDelete: string[] = [];

    if (enrollment.sigaaReceiptFileId) {
      fileIdsToDelete.push(enrollment.sigaaReceiptFileId);
    }

    if (enrollment.poscomp?.receiptFileId) {
      fileIdsToDelete.push(enrollment.poscomp.receiptFileId);
    }

    if (enrollment.projectFileId) {
      fileIdsToDelete.push(enrollment.projectFileId);
    }

    if (enrollment.undergradProofFileId) {
      fileIdsToDelete.push(enrollment.undergradProofFileId);
    }

    for (const degree of enrollment.mastersDegrees ?? []) {
      if (degree.proofFileId) {
        fileIdsToDelete.push(degree.proofFileId);
      }
    }

    const cvItemFileIds = await this.enrollmentRepository.findCvItemFileIds(id);
    fileIdsToDelete.push(...cvItemFileIds);

    // Delete files from storage
    for (const fileId of fileIdsToDelete) {
      try {
        await this.fileStorageService.delete(fileId);
      } catch (error) {
        this.logger.error(
          `Erro ao deletar arquivo ${fileId} do storage durante cancelamento:`,
          error,
        );
      }
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

  async getSigaaReceiptUrl(user: User, id: string): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    const isOwner = enrollment.candidateId === user.id;
    const isStaff = [
      RoleEnum.professor,
      RoleEnum.mdccSecretary,
      RoleEnum.postGraduateCoordinator,
      RoleEnum.postGraduateViceCoordinator,
    ].includes(user.role);

    if (!isOwner && !isStaff) {
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

  async getPoscompReceiptUrl(user: User, id: string): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    const isOwner = enrollment.candidateId === user.id;
    const isStaff = [
      RoleEnum.professor,
      RoleEnum.mdccSecretary,
      RoleEnum.postGraduateCoordinator,
      RoleEnum.postGraduateViceCoordinator,
    ].includes(user.role);

    if (!isOwner && !isStaff) {
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

  async uploadProjectFile(
    userId: string,
    id: string,
    file: Express.Multer.File,
  ): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta inscrição.');
    }

    if (enrollment.level !== 'doctoral') {
      throw new BadRequestException(
        'O arquivo do projeto é exclusivo para inscrições de doutorado.',
      );
    }

    if (enrollment.status !== ENROLLMENT_STATUS.DRAFT) {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser editadas.');
    }

    if (enrollment.projectFileId) {
      await this.fileStorageService.delete(enrollment.projectFileId);
    }

    const fileRecord = await this.fileStorageService.upload(file, userId, 'project-files');

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      projectFileId: fileRecord.id,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Arquivo do projeto enviado para inscrição: ${id}`);
    return updated;
  }

  async getProjectFileUrl(user: User, id: string): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    const isOwner = enrollment.candidateId === user.id;
    const isStaff = [
      RoleEnum.professor,
      RoleEnum.mdccSecretary,
      RoleEnum.postGraduateCoordinator,
      RoleEnum.postGraduateViceCoordinator,
    ].includes(user.role);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Você não tem permissão para acessar esta inscrição.');
    }

    if (!enrollment.projectFileId) {
      throw new NotFoundException('Arquivo do projeto não encontrado.');
    }

    const fileRecord = await this.fileStorageService.findById(enrollment.projectFileId);
    const url = await this.fileStorageService.getSignedDownloadUrl(enrollment.projectFileId);
    return { url, fileName: fileRecord.originalName };
  }

  async uploadUndergradProof(
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

    if (enrollment.undergradProofFileId) {
      await this.fileStorageService.delete(enrollment.undergradProofFileId);
    }

    const fileRecord = await this.fileStorageService.upload(file, userId, 'undergrad-proofs');

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      undergradProofFileId: fileRecord.id,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Comprovante de graduação enviado para inscrição: ${id}`);
    return updated;
  }

  async getUndergradProofUrl(user: User, id: string): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    const isOwner = enrollment.candidateId === user.id;
    const isStaff = [
      RoleEnum.professor,
      RoleEnum.mdccSecretary,
      RoleEnum.postGraduateCoordinator,
      RoleEnum.postGraduateViceCoordinator,
    ].includes(user.role);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Você não tem permissão para acessar esta inscrição.');
    }

    if (!enrollment.undergradProofFileId) {
      throw new NotFoundException('Comprovante de graduação não encontrado.');
    }

    const fileRecord = await this.fileStorageService.findById(enrollment.undergradProofFileId);
    const url = await this.fileStorageService.getSignedDownloadUrl(enrollment.undergradProofFileId);
    return { url, fileName: fileRecord.originalName };
  }

  async uploadMastersDegreeProof(
    userId: string,
    id: string,
    index: number,
    file: Express.Multer.File,
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

    const degrees = enrollment.mastersDegrees;
    if (!degrees || index < 0 || index >= degrees.length) {
      throw new NotFoundException('Curso de mestrado não encontrado.');
    }

    const existing = degrees[index];
    if (existing.proofFileId) {
      await this.fileStorageService.delete(existing.proofFileId);
    }

    const fileRecord = await this.fileStorageService.upload(file, userId, 'masters-degree-proofs');

    const updatedDegrees = degrees.map((degree, i) =>
      i === index ? { ...degree, proofFileId: fileRecord.id } : degree,
    );

    const now = new Date();
    const updated = await this.enrollmentRepository.update(id, {
      mastersDegrees: updatedDegrees,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    this.logger.log(`Comprovante de mestrado enviado para inscrição ${id} (índice ${index})`);
    return updated;
  }

  async getMastersDegreeProofUrl(
    user: User,
    id: string,
    index: number,
  ): Promise<{ url: string; fileName: string }> {
    const enrollment = await this.findById(id);

    const isOwner = enrollment.candidateId === user.id;
    const isStaff = [
      RoleEnum.professor,
      RoleEnum.mdccSecretary,
      RoleEnum.postGraduateCoordinator,
      RoleEnum.postGraduateViceCoordinator,
    ].includes(user.role);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Você não tem permissão para acessar esta inscrição.');
    }

    const degrees = enrollment.mastersDegrees;
    if (!degrees || index < 0 || index >= degrees.length) {
      throw new NotFoundException('Curso de mestrado não encontrado.');
    }

    const proofFileId = degrees[index].proofFileId;
    if (!proofFileId) {
      throw new NotFoundException('Comprovante do mestrado não encontrado.');
    }

    const fileRecord = await this.fileStorageService.findById(proofFileId);
    const url = await this.fileStorageService.getSignedDownloadUrl(proofFileId);
    return { url, fileName: fileRecord.originalName };
  }
}
