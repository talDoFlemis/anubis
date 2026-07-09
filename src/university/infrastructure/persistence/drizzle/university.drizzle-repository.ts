import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import type { CourseSelect, UniversitySelect } from '../../../../database/schema/universities';

import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { courses, universities } from '../../../../database/schema/universities';
import {
  UniversityRepository,
  type CreateCourseData,
  type CreateUniversityData,
} from '../university.repository';

@Injectable()
export class UniversityDrizzleRepository extends UniversityRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async searchUniversities(query: string, limit: number = 20): Promise<UniversitySelect[]> {
    return this.db
      .select()
      .from(universities)
      .where(sql`${universities.searchVector} @@ plainto_tsquery('simple', ${query})`)
      .orderBy(sql`ts_rank(${universities.searchVector}, plainto_tsquery('simple', ${query})) DESC`)
      .limit(limit);
  }

  async searchCourses(
    query: string,
    universityId?: string,
    limit: number = 20,
  ): Promise<CourseSelect[]> {
    const searchCondition = sql`${courses.searchVector} @@ plainto_tsquery('simple', ${query})`;

    const whereCondition = universityId
      ? and(searchCondition, eq(courses.universityId, universityId))
      : searchCondition;

    return this.db
      .select()
      .from(courses)
      .where(whereCondition)
      .orderBy(sql`ts_rank(${courses.searchVector}, plainto_tsquery('simple', ${query})) DESC`)
      .limit(limit);
  }

  async findUniversityById(id: string): Promise<UniversitySelect | null> {
    const [row] = await this.db.select().from(universities).where(eq(universities.id, id)).limit(1);

    return row ?? null;
  }

  async findCourseById(id: string): Promise<CourseSelect | null> {
    const [row] = await this.db.select().from(courses).where(eq(courses.id, id)).limit(1);

    return row ?? null;
  }

  async createUniversity(data: CreateUniversityData): Promise<UniversitySelect> {
    const [row] = await this.db
      .insert(universities)
      .values({ ...data, isManual: true })
      .returning();

    return row;
  }

  async createCourse(data: CreateCourseData): Promise<CourseSelect> {
    const [row] = await this.db
      .insert(courses)
      .values({ ...data, isManual: true })
      .returning();

    return row;
  }

  async setUniversityGrade(id: string, mecGrade: number | null): Promise<UniversitySelect> {
    const [row] = await this.db
      .update(universities)
      .set({ mecGrade })
      .where(eq(universities.id, id))
      .returning();

    return row;
  }

  async setUniversityStatus(id: string, status: string): Promise<UniversitySelect> {
    const [row] = await this.db
      .update(universities)
      .set({ status })
      .where(eq(universities.id, id))
      .returning();

    return row;
  }

  async findPendingUniversities(): Promise<UniversitySelect[]> {
    return this.db
      .select()
      .from(universities)
      .where(eq(universities.status, 'pending'))
      .orderBy(universities.name);
  }

  async mergeUniversities(sourceId: string, targetId: string): Promise<void> {
    const enrollmentsSchema = await import('../../../../database/schema/enrollments.js');
    await this.db.transaction(async tx => {
      // 1. Redirect enrollments to target
      await tx
        .update(enrollmentsSchema.enrollments)
        .set({ undergradUniversityId: targetId })
        .where(eq(enrollmentsSchema.enrollments.undergradUniversityId, sourceId));

      // 2. Redirect courses to target
      await tx
        .update(courses)
        .set({ universityId: targetId })
        .where(eq(courses.universityId, sourceId));

      // 3. Delete source university
      await tx.delete(universities).where(eq(universities.id, sourceId));
    });
  }

  async setCourseStatus(id: string, status: string): Promise<CourseSelect> {
    const [row] = await this.db
      .update(courses)
      .set({ status })
      .where(eq(courses.id, id))
      .returning();

    return row;
  }

  async findPendingCourses(): Promise<CourseSelect[]> {
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.status, 'pending'))
      .orderBy(courses.name);
  }

  async mergeCourses(sourceId: string, targetId: string): Promise<void> {
    const enrollmentsSchema = await import('../../../../database/schema/enrollments.js');
    await this.db.transaction(async tx => {
      // 1. Redirect enrollments to target
      await tx
        .update(enrollmentsSchema.enrollments)
        .set({ undergradCourseId: targetId })
        .where(eq(enrollmentsSchema.enrollments.undergradCourseId, sourceId));

      // 2. Delete source course
      await tx.delete(courses).where(eq(courses.id, sourceId));
    });
  }
}
