import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import type { PaginatedResult } from '../../../../common/dto/paginated-response.dto';
import { buildPaginatedResult } from '../../../../common/dto/paginated-response.dto';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { cvItems } from '../../../../database/schema/cv-items';
import { enrollments } from '../../../../database/schema/enrollments';
import { Enrollment } from '../../../domain/enrollment';
import type { CreateEnrollmentData, FindEnrollmentsFilters } from '../enrollment.repository';
import { EnrollmentRepository } from '../enrollment.repository';

import type { SQL } from 'drizzle-orm';

@Injectable()
export class EnrollmentDrizzleRepository extends EnrollmentRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: string): Promise<Enrollment | null> {
    const [row] = await this.db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);

    if (!row) return null;
    return Enrollment.toDomain(row);
  }

  async findByCandidateId(candidateId: string): Promise<Enrollment[]> {
    const rows = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.candidateId, candidateId));

    return rows.map(row => Enrollment.toDomain(row));
  }

  async findByCandidateAndPeriod(
    candidateId: string,
    enrollmentPeriodId: string,
  ): Promise<Enrollment | null> {
    const [row] = await this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.candidateId, candidateId),
          eq(enrollments.enrollmentPeriodId, enrollmentPeriodId),
        ),
      )
      .limit(1);

    if (!row) return null;
    return Enrollment.toDomain(row);
  }

  async findAll(filters: FindEnrollmentsFilters): Promise<PaginatedResult<Enrollment>> {
    const conditions: SQL[] = [];
    const offset = (filters.page - 1) * filters.limit;

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
      .limit(filters.limit)
      .offset(offset);

    const [totalRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(whereClause);

    return buildPaginatedResult({
      data: rows.map(row => Enrollment.toDomain(row)),
      page: filters.page,
      limit: filters.limit,
      total: totalRow?.count ?? 0,
    });
  }

  async create(data: CreateEnrollmentData): Promise<Enrollment> {
    const [row] = await this.db
      .insert(enrollments)
      .values({
        candidateId: data.candidateId,
        enrollmentPeriodId: data.enrollmentPeriodId,
        level: data.level as 'masters' | 'doctoral',
        status: data.status as 'draft' | 'submitted' | 'closed' | 'cancelled',
      })
      .returning();

    return Enrollment.toDomain(row);
  }

  async update(id: string, data: Record<string, unknown>): Promise<Enrollment | null> {
    const [row] = await this.db
      .update(enrollments)
      .set(data)
      .where(eq(enrollments.id, id))
      .returning();

    if (!row) return null;
    return Enrollment.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(enrollments).where(eq(enrollments.id, id));
  }

  async findCvItemFileIds(enrollmentId: string): Promise<string[]> {
    const rows = await this.db
      .select({ proofFileId: cvItems.proofFileId })
      .from(cvItems)
      .where(eq(cvItems.enrollmentId, enrollmentId));

    return rows.map(r => r.proofFileId).filter((id): id is string => id !== null);
  }
}
