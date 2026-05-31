import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';

import type { CourseSelect, UniversitySelect } from '../database/schema/universities';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import { courses, universities } from '../database/schema/universities';
import type { CreateCourseDto } from './dto/create-course.dto';
import type { CreateUniversityDto } from './dto/create-university.dto';

@Injectable()
export class UniversityService {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async searchUniversities(query: string, limit: number = 20): Promise<UniversitySelect[]> {
    return this.db
      .select()
      .from(universities)
      .where(
        or(ilike(universities.name, `%${query}%`), ilike(universities.abbreviation, `%${query}%`)),
      )
      .limit(limit);
  }

  async searchCourses(
    query: string,
    universityId?: string,
    limit: number = 20,
  ): Promise<CourseSelect[]> {
    const nameCondition = ilike(courses.name, `%${query}%`);

    const whereCondition = universityId
      ? and(nameCondition, eq(courses.universityId, universityId))
      : nameCondition;

    return this.db.select().from(courses).where(whereCondition).limit(limit);
  }

  async findUniversityById(id: string): Promise<UniversitySelect> {
    const [row] = await this.db.select().from(universities).where(eq(universities.id, id)).limit(1);

    if (!row) throw new NotFoundException('Universidade não encontrada');
    return row;
  }

  async findCourseById(id: string): Promise<CourseSelect> {
    const [row] = await this.db.select().from(courses).where(eq(courses.id, id)).limit(1);

    if (!row) throw new NotFoundException('Curso não encontrado');
    return row;
  }

  async createUniversity(dto: CreateUniversityDto): Promise<UniversitySelect> {
    const [row] = await this.db
      .insert(universities)
      .values({ ...dto, isManual: true })
      .returning();

    return row;
  }

  async createCourse(dto: CreateCourseDto): Promise<CourseSelect> {
    const [row] = await this.db
      .insert(courses)
      .values({ ...dto, isManual: true })
      .returning();

    return row;
  }
}
