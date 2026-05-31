import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gt, lte, ne, or } from 'drizzle-orm';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import { enrollmentPeriods } from '../database/schema/enrollment-periods';
import { enrollments } from '../database/schema/enrollments';
import type { PeriodStatus } from './constants/enrollment-status';
import { PERIOD_STATUS } from './constants/enrollment-status';
import { EnrollmentPeriod } from './domain/enrollment-period';
import type { CreateEnrollmentPeriodDto } from './dto/create-enrollment-period.dto';
import type { UpdateEnrollmentPeriodDto } from './dto/update-enrollment-period.dto';

@Injectable()
export class EnrollmentPeriodService {
  private readonly logger = new Logger(EnrollmentPeriodService.name);

  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async create(dto: CreateEnrollmentPeriodDto): Promise<EnrollmentPeriod> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('A data de início deve ser anterior à data de término.');
    }

    const overlapping = await this.db
      .select({
        id: enrollmentPeriods.id,
        name: enrollmentPeriods.name,
        startDate: enrollmentPeriods.startDate,
        endDate: enrollmentPeriods.endDate,
      })
      .from(enrollmentPeriods)
      .where(
        and(
          ne(enrollmentPeriods.status, PERIOD_STATUS.CLOSED),
          or(
            and(
              lte(enrollmentPeriods.startDate, endDate),
              gt(enrollmentPeriods.endDate, startDate),
            ),
          ),
        ),
      )
      .limit(1);

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

    const [row] = await this.db
      .insert(enrollmentPeriods)
      .values({
        name: dto.name,
        semester: dto.semester,
        startDate,
        endDate,
        status,
      })
      .returning();

    this.logger.log('Período de inscrição criado');
    return EnrollmentPeriod.toDomain(row);
  }

  async findAll(): Promise<EnrollmentPeriod[]> {
    const rows = await this.db
      .select()
      .from(enrollmentPeriods)
      .orderBy(desc(enrollmentPeriods.createdAt));

    return rows.map(row => EnrollmentPeriod.toDomain(row));
  }

  async findById(id: string): Promise<EnrollmentPeriod> {
    const [row] = await this.db
      .select()
      .from(enrollmentPeriods)
      .where(eq(enrollmentPeriods.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Período de inscrição não encontrado.');
    }

    return EnrollmentPeriod.toDomain(row);
  }

  async findCurrentOpen(): Promise<EnrollmentPeriod[]> {
    const rows = await this.db
      .select()
      .from(enrollmentPeriods)
      .where(eq(enrollmentPeriods.status, PERIOD_STATUS.OPEN))
      .orderBy(desc(enrollmentPeriods.startDate));

    return rows.map(row => EnrollmentPeriod.toDomain(row));
  }

  async update(id: string, dto: UpdateEnrollmentPeriodDto): Promise<EnrollmentPeriod> {
    const existing = await this.findById(id);

    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('A data de início deve ser anterior à data de término.');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.semester !== undefined) updateData.semester = dto.semester;
    if (dto.startDate !== undefined) updateData.startDate = startDate;
    if (dto.endDate !== undefined) updateData.endDate = endDate;

    const [row] = await this.db
      .update(enrollmentPeriods)
      .set(updateData)
      .where(eq(enrollmentPeriods.id, id))
      .returning();

    this.logger.log('Período de inscrição atualizado');
    return EnrollmentPeriod.toDomain(row);
  }

  async close(id: string): Promise<EnrollmentPeriod> {
    await this.findById(id);

    const now = new Date();
    const [row] = await this.db
      .update(enrollmentPeriods)
      .set({ status: PERIOD_STATUS.CLOSED, endDate: now, updatedAt: now })
      .where(eq(enrollmentPeriods.id, id))
      .returning();

    this.logger.log('Período de inscrição fechado manualmente');
    return EnrollmentPeriod.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.enrollmentPeriodId, id))
      .limit(1);

    if (enrollment) {
      throw new ConflictException('Não é possível excluir um período que possui inscrições.');
    }

    await this.db.delete(enrollmentPeriods).where(eq(enrollmentPeriods.id, id));

    this.logger.log('Período de inscrição removido');
  }

  async syncStatuses(): Promise<void> {
    const now = new Date();

    // Open scheduled periods whose start date has passed
    const opened = await this.db
      .update(enrollmentPeriods)
      .set({ status: PERIOD_STATUS.OPEN, updatedAt: now })
      .where(
        and(
          eq(enrollmentPeriods.status, PERIOD_STATUS.SCHEDULED),
          lte(enrollmentPeriods.startDate, now),
          gt(enrollmentPeriods.endDate, now),
        ),
      )
      .returning({ id: enrollmentPeriods.id });

    if (opened.length > 0) {
      this.logger.log(`Períodos abertos automaticamente: ${opened.map(r => r.id).join(', ')}`);
    }

    // Close open periods whose end date has passed
    const closed = await this.db
      .update(enrollmentPeriods)
      .set({ status: PERIOD_STATUS.CLOSED, updatedAt: now })
      .where(and(eq(enrollmentPeriods.status, PERIOD_STATUS.OPEN), lte(enrollmentPeriods.endDate, now)))
      .returning({ id: enrollmentPeriods.id });

    if (closed.length > 0) {
      this.logger.log(`Períodos fechados automaticamente: ${closed.map(r => r.id).join(', ')}`);
    }

    // Also close scheduled periods whose end date has already passed
    // (e.g. period was scheduled but start and end both in the past)
    const skipped = await this.db
      .update(enrollmentPeriods)
      .set({ status: PERIOD_STATUS.CLOSED, updatedAt: now })
      .where(and(eq(enrollmentPeriods.status, PERIOD_STATUS.SCHEDULED), lte(enrollmentPeriods.endDate, now)))
      .returning({ id: enrollmentPeriods.id });

    if (skipped.length > 0) {
      this.logger.log(
        `Períodos agendados expirados fechados: ${skipped.map(r => r.id).join(', ')}`,
      );
    }
  }
}
