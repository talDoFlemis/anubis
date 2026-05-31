import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, lte, ne, or } from 'drizzle-orm';

import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { enrollmentPeriods } from '../../../../database/schema/enrollment-periods';
import { enrollments } from '../../../../database/schema/enrollments';
import type { PeriodStatus } from '../../../constants/enrollment-status';
import { PERIOD_STATUS } from '../../../constants/enrollment-status';
import { EnrollmentPeriod } from '../../../domain/enrollment-period';
import type {
  CreateEnrollmentPeriodData,
  OverlappingPeriodInfo,
  SyncStatusesResult,
  UpdateEnrollmentPeriodData,
} from '../enrollment-period.repository';
import { EnrollmentPeriodRepository } from '../enrollment-period.repository';

@Injectable()
export class EnrollmentPeriodDrizzleRepository extends EnrollmentPeriodRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async findAll(): Promise<EnrollmentPeriod[]> {
    const rows = await this.db
      .select()
      .from(enrollmentPeriods)
      .orderBy(desc(enrollmentPeriods.createdAt));

    return rows.map(row => EnrollmentPeriod.toDomain(row));
  }

  async findById(id: string): Promise<EnrollmentPeriod | null> {
    const [row] = await this.db
      .select()
      .from(enrollmentPeriods)
      .where(eq(enrollmentPeriods.id, id))
      .limit(1);

    if (!row) return null;
    return EnrollmentPeriod.toDomain(row);
  }

  async findByStatus(status: PeriodStatus): Promise<EnrollmentPeriod[]> {
    const rows = await this.db
      .select()
      .from(enrollmentPeriods)
      .where(eq(enrollmentPeriods.status, status))
      .orderBy(desc(enrollmentPeriods.startDate));

    return rows.map(row => EnrollmentPeriod.toDomain(row));
  }

  async findOverlapping(startDate: Date, endDate: Date): Promise<OverlappingPeriodInfo[]> {
    return this.db
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
  }

  async create(data: CreateEnrollmentPeriodData): Promise<EnrollmentPeriod> {
    const [row] = await this.db
      .insert(enrollmentPeriods)
      .values({
        name: data.name,
        semester: data.semester,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
      })
      .returning();

    return EnrollmentPeriod.toDomain(row);
  }

  async update(id: string, data: UpdateEnrollmentPeriodData): Promise<EnrollmentPeriod | null> {
    const updateData: Record<string, unknown> = { updatedAt: data.updatedAt };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.semester !== undefined) updateData.semester = data.semester;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;

    const [row] = await this.db
      .update(enrollmentPeriods)
      .set(updateData)
      .where(eq(enrollmentPeriods.id, id))
      .returning();

    if (!row) return null;
    return EnrollmentPeriod.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(enrollmentPeriods).where(eq(enrollmentPeriods.id, id));
  }

  async hasEnrollments(periodId: string): Promise<boolean> {
    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.enrollmentPeriodId, periodId))
      .limit(1);

    return !!enrollment;
  }

  async syncStatuses(now: Date): Promise<SyncStatusesResult> {
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

    // Close open periods whose end date has passed
    const closed = await this.db
      .update(enrollmentPeriods)
      .set({ status: PERIOD_STATUS.CLOSED, updatedAt: now })
      .where(
        and(eq(enrollmentPeriods.status, PERIOD_STATUS.OPEN), lte(enrollmentPeriods.endDate, now)),
      )
      .returning({ id: enrollmentPeriods.id });

    // Also close scheduled periods whose end date has already passed
    const skipped = await this.db
      .update(enrollmentPeriods)
      .set({ status: PERIOD_STATUS.CLOSED, updatedAt: now })
      .where(
        and(
          eq(enrollmentPeriods.status, PERIOD_STATUS.SCHEDULED),
          lte(enrollmentPeriods.endDate, now),
        ),
      )
      .returning({ id: enrollmentPeriods.id });

    return { opened, closed, skipped };
  }
}
