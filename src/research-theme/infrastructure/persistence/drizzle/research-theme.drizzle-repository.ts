import { buildPaginatedResult, type PaginatedResult } from '@/common/dto/paginated-response.dto';
import { DRIZZLE_TX } from '@/database/drizzle.constants';
import type { DrizzleDB } from '@/database/drizzle.provider';
import { researchThemes } from '@/database/schema/research-themes';
import { ResearchTheme } from '@/research-theme/domain/research-theme';
import { FindResearchThemesDto } from '@/research-theme/dto/find-research-themes.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import type {
  CreateResearchThemeData,
  UpdateResearchThemeData,
} from '../research-theme.repository';
import { ResearchThemeRepository } from '../research-theme.repository';

type ResearchThemeRow = typeof researchThemes.$inferSelect;

@Injectable()
export class ResearchThemeDrizzleRepository extends ResearchThemeRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateResearchThemeData): Promise<ResearchTheme> {
    const [row] = await this.db
      .insert(researchThemes)
      .values({
        professorId: data.professorId,
        title: data.title,
        description: data.description,
        vacancies: data.vacancies,
        level: data.level,
        references: data.references,
      })
      .returning();

    return this.toDomain(row);
  }

  async findById(id: string): Promise<ResearchTheme | null> {
    const [row] = await this.db
      .select()
      .from(researchThemes)
      .where(eq(researchThemes.id, id))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findAllByFilters(filters: FindResearchThemesDto): Promise<PaginatedResult<ResearchTheme>> {
    const conditions: SQL[] = [];
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    if (filters.level) {
      conditions.push(eq(researchThemes.level, filters.level));
    }
    if (filters.professorId) {
      conditions.push(eq(researchThemes.professorId, filters.professorId));
    }

    const rows = await this.db
      .select()
      .from(researchThemes)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(researchThemes.createdAt, researchThemes.id)
      .limit(limit)
      .offset(offset);

    const [totalRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(researchThemes)
      .where(conditions.length ? and(...conditions) : undefined);

    return buildPaginatedResult({
      data: rows.map(row => this.toDomain(row)),
      page,
      limit,
      total: totalRow?.count ?? 0,
    });
  }

  async update(id: string, data: UpdateResearchThemeData): Promise<ResearchTheme | null> {
    const [row] = await this.db
      .update(researchThemes)
      .set({
        title: data.title,
        description: data.description,
        vacancies: data.vacancies,
        level: data.level,
        references: data.references,
        updatedAt: new Date(),
      })
      .where(eq(researchThemes.id, id))
      .returning();

    return row ? this.toDomain(row) : null;
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(researchThemes).where(eq(researchThemes.id, id));
  }

  hasEnrollments(id: string): Promise<boolean> {
    // TODO(#73): Implement once enrollment table exists.
    void id;
    return Promise.resolve(false);
  }

  private toDomain(row: ResearchThemeRow): ResearchTheme {
    return {
      id: row.id,
      professorId: row.professorId,
      title: row.title,
      description: row.description,
      vacancies: row.vacancies,
      level: row.level as ResearchTheme['level'],
      references: row.references ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
