import { buildPaginatedResult, type PaginatedResult } from '@/common/dto/paginated-response.dto';
import { DRIZZLE_TX } from '@/database/drizzle.constants';
import type { DrizzleDB } from '@/database/drizzle.provider';
import { researchThemeProfessors, researchThemes } from '@/database/schema/research-themes';
import { users } from '@/database/schema/users';
import { ResearchTheme } from '@/research-theme/domain/research-theme';
import { FindResearchThemesDto } from '@/research-theme/dto/find-research-themes.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, exists, ilike, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type {
  CreateResearchThemeData,
  UpdateResearchThemeData,
} from '../research-theme.repository';
import { ResearchThemeRepository } from '../research-theme.repository';

type ResearchThemeRow = typeof researchThemes.$inferSelect;

type AssociatedProfessorRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

@Injectable()
export class ResearchThemeDrizzleRepository extends ResearchThemeRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateResearchThemeData): Promise<ResearchTheme> {
    return await this.db.transaction(async tx => {
      const [row] = await tx
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

      if (data.associatedProfessorIds && data.associatedProfessorIds.length > 0) {
        await tx.insert(researchThemeProfessors).values(
          data.associatedProfessorIds.map(profId => ({
            researchThemeId: row.id,
            professorId: profId,
          })),
        );
      }

      const created = await this.findByIdWithTx(row.id, tx);
      if (!created) {
        throw new Error('Failed to fetch created research theme');
      }
      return created;
    });
  }

  async findById(id: string): Promise<ResearchTheme | null> {
    return this.findByIdWithTx(id, this.db);
  }

  private async findByIdWithTx(id: string, tx: DrizzleDB): Promise<ResearchTheme | null> {
    const assocUsers = alias(users, 'assoc_users');

    const [row] = await tx
      .select({
        theme: researchThemes,
        professor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        associatedProfessors: sql<AssociatedProfessorRow[]>`
          coalesce(
            json_agg(
              json_build_object(
                'id', ${assocUsers.id},
                'firstName', ${assocUsers.firstName},
                'lastName', ${assocUsers.lastName},
                'email', ${assocUsers.email}
              )
            ) filter (where ${assocUsers.id} is not null),
            '[]'::json
          )
        `,
      })
      .from(researchThemes)
      .leftJoin(users, eq(users.id, researchThemes.professorId))
      .leftJoin(
        researchThemeProfessors,
        eq(researchThemeProfessors.researchThemeId, researchThemes.id),
      )
      .leftJoin(assocUsers, eq(assocUsers.id, researchThemeProfessors.professorId))
      .where(eq(researchThemes.id, id))
      .groupBy(researchThemes.id, users.id)
      .limit(1);

    if (!row) return null;

    return {
      ...this.toDomain(row.theme),
      professor: row.professor ?? undefined,
      associatedProfessors: row.associatedProfessors,
    };
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
      conditions.push(
        or(
          eq(researchThemes.professorId, filters.professorId),
          sql`exists (
            select 1 from ${researchThemeProfessors} 
            where ${researchThemeProfessors.researchThemeId} = ${researchThemes.id} 
            and ${researchThemeProfessors.professorId} = ${filters.professorId}
          )`,
        )!,
      );
    }
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(researchThemes.title, searchPattern),
          ilike(researchThemes.description, searchPattern),
          exists(
            this.db
              .select({ one: sql`1` })
              .from(users)
              .where(
                and(
                  eq(users.id, researchThemes.professorId),
                  sql`${users.searchVector} @@ plainto_tsquery('simple', ${filters.search})`,
                ),
              ),
          ),
          exists(
            this.db
              .select({ one: sql`1` })
              .from(researchThemeProfessors)
              .innerJoin(users, eq(users.id, researchThemeProfessors.professorId))
              .where(
                and(
                  eq(researchThemeProfessors.researchThemeId, researchThemes.id),
                  sql`${users.searchVector} @@ plainto_tsquery('simple', ${filters.search})`,
                ),
              ),
          ),
        )!,
      );
    }

    const assocUsers = alias(users, 'assoc_users');

    const rows = await this.db
      .select({
        theme: researchThemes,
        professor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        associatedProfessors: sql<AssociatedProfessorRow[]>`
          coalesce(
            json_agg(
              json_build_object(
                'id', ${assocUsers.id},
                'firstName', ${assocUsers.firstName},
                'lastName', ${assocUsers.lastName},
                'email', ${assocUsers.email}
              )
            ) filter (where ${assocUsers.id} is not null),
            '[]'::json
          )
        `,
        totalCount: sql<number>`count(*) over()::int`,
      })
      .from(researchThemes)
      .leftJoin(users, eq(users.id, researchThemes.professorId))
      .leftJoin(
        researchThemeProfessors,
        eq(researchThemeProfessors.researchThemeId, researchThemes.id),
      )
      .leftJoin(assocUsers, eq(assocUsers.id, researchThemeProfessors.professorId))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(researchThemes.id, users.id)
      .orderBy(researchThemes.createdAt, researchThemes.id)
      .limit(limit)
      .offset(offset);

    const total = rows[0]?.totalCount ?? 0;
    const data = rows.map(r => ({
      ...this.toDomain(r.theme),
      professor: r.professor ?? undefined,
      associatedProfessors: r.associatedProfessors,
    }));

    return buildPaginatedResult({
      data,
      page,
      limit,
      total,
    });
  }

  async update(id: string, data: UpdateResearchThemeData): Promise<ResearchTheme | null> {
    return await this.db.transaction(async tx => {
      const [row] = await tx
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

      if (!row) return null;

      if (data.associatedProfessorIds !== undefined) {
        await tx
          .delete(researchThemeProfessors)
          .where(eq(researchThemeProfessors.researchThemeId, id));

        if (data.associatedProfessorIds.length > 0) {
          await tx.insert(researchThemeProfessors).values(
            data.associatedProfessorIds.map(profId => ({
              researchThemeId: id,
              professorId: profId,
            })),
          );
        }
      }

      return this.findByIdWithTx(id, tx);
    });
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
