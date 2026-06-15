import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  DOCTORAL_SECTIONS,
  MASTERS_SECTIONS,
} from '../cv-scoring/constants/cv-scoring-config';
import { CvScoringCategoryService } from '../cv-scoring/cv-scoring-category.service';
import type { PeriodStatus } from './constants/enrollment-status';
import { PERIOD_STATUS } from './constants/enrollment-status';
import type { EnrollmentPeriod } from './domain/enrollment-period';
import type { CreateEnrollmentPeriodDto } from './dto/create-enrollment-period.dto';
import { EnrollmentLevel } from './dto/enrollment-level.enum';
import type { UpdateEnrollmentPeriodDto } from './dto/update-enrollment-period.dto';
import { EnrollmentPeriodRepository } from './infrastructure/persistence/enrollment-period.repository';

@Injectable()
export class EnrollmentPeriodService {
  private readonly logger = new Logger(EnrollmentPeriodService.name);

  constructor(
    private readonly enrollmentPeriodRepository: EnrollmentPeriodRepository,
    private readonly cvScoringCategoryService: CvScoringCategoryService,
  ) {}

  async create(dto: CreateEnrollmentPeriodDto): Promise<EnrollmentPeriod> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('A data de início deve ser anterior à data de término.');
    }

    const overlapping = await this.enrollmentPeriodRepository.findOverlapping(startDate, endDate);

    if (overlapping.length > 0) {
      const conflict = overlapping[0];
      const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      throw new ConflictException(
        `Já existe um período ativo ou agendado que se sobrepõe: "${conflict.name}" (${fmt(conflict.startDate)} — ${fmt(conflict.endDate)}).`,
      );
    }

    const now = new Date();
    let status: PeriodStatus = PERIOD_STATUS.SCHEDULED;
    if (startDate <= now && endDate > now) {
      status = PERIOD_STATUS.OPEN;
    } else if (endDate <= now) {
      status = PERIOD_STATUS.CLOSED;
    }

    const period = await this.enrollmentPeriodRepository.create({
      name: dto.name,
      semester: dto.semester,
      startDate,
      endDate,
      status,
    });

    await this.seedDefaultCategories(period.id);

    this.logger.log('Período de inscrição criado');
    return period;
  }

  /**
   * Materializes the static CV scoring sections (defined in cv-scoring-config.ts)
   * for a newly created period. Sections are not staff-authored — config is the
   * single source of truth, so every period gets the same canonical categories.
   */
  private async seedDefaultCategories(periodId: string): Promise<void> {
    const groups = [
      { sections: Object.values(MASTERS_SECTIONS), level: EnrollmentLevel.Masters },
      { sections: Object.values(DOCTORAL_SECTIONS), level: EnrollmentLevel.Doctoral },
    ];

    for (const { sections, level } of groups) {
      for (const section of sections) {
        await this.cvScoringCategoryService.create(periodId, {
          name: section.name,
          description: section.description,
          pointsPerItem: 0,
          maxPoints: section.maxPoints,
          level,
          sortOrder: section.sortOrder,
        });
      }
    }
  }

  async findAll(): Promise<EnrollmentPeriod[]> {
    return this.enrollmentPeriodRepository.findAll();
  }

  async findById(id: string): Promise<EnrollmentPeriod> {
    const period = await this.enrollmentPeriodRepository.findById(id);

    if (!period) {
      throw new NotFoundException('Período de inscrição não encontrado.');
    }

    return period;
  }

  async findCurrentOpen(): Promise<EnrollmentPeriod[]> {
    return this.enrollmentPeriodRepository.findByStatus(PERIOD_STATUS.OPEN);
  }

  async update(id: string, dto: UpdateEnrollmentPeriodDto): Promise<EnrollmentPeriod> {
    const existing = await this.findById(id);

    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('A data de início deve ser anterior à data de término.');
    }

    const updated = await this.enrollmentPeriodRepository.update(id, {
      name: dto.name,
      semester: dto.semester,
      startDate: dto.startDate ? startDate : undefined,
      endDate: dto.endDate ? endDate : undefined,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundException('Período de inscrição não encontrado.');
    }

    this.logger.log('Período de inscrição atualizado');
    return updated;
  }

  async close(id: string): Promise<EnrollmentPeriod> {
    await this.findById(id);

    const now = new Date();
    const updated = await this.enrollmentPeriodRepository.update(id, {
      status: PERIOD_STATUS.CLOSED,
      endDate: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new NotFoundException('Período de inscrição não encontrado.');
    }

    this.logger.log('Período de inscrição fechado manualmente');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    const hasEnrollments = await this.enrollmentPeriodRepository.hasEnrollments(id);

    if (hasEnrollments) {
      throw new ConflictException('Não é possível excluir um período que possui inscrições.');
    }

    await this.enrollmentPeriodRepository.remove(id);

    this.logger.log('Período de inscrição removido');
  }

  async syncStatuses(): Promise<void> {
    const now = new Date();
    const result = await this.enrollmentPeriodRepository.syncStatuses(now);

    if (result.opened.length > 0) {
      this.logger.log(
        `Períodos abertos automaticamente: ${result.opened.map(r => r.id).join(', ')}`,
      );
    }

    if (result.closed.length > 0) {
      this.logger.log(
        `Períodos fechados automaticamente: ${result.closed.map(r => r.id).join(', ')}`,
      );
    }

    if (result.skipped.length > 0) {
      this.logger.log(
        `Períodos agendados expirados fechados: ${result.skipped.map(r => r.id).join(', ')}`,
      );
    }
  }
}
