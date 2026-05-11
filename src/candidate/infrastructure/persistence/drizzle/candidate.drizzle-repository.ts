import { buildPaginatedResult, type PaginatedResult } from '@/common/dto/paginated-response.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, ilike, lte, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { candidates } from '../../../../database/schema/candidates';
import { users } from '../../../../database/schema/users';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { Candidate } from '../../../domain/candidate';
import { CandidateProfile } from '../../../domain/candidate-profile';
import { FindCandidatesDto } from '../../../dto/find-candidates.dto';
import { CandidateRepository } from '../candidate.repository';

type CandidateRow = typeof candidates.$inferSelect;

@Injectable()
export class CandidateDrizzleRepository extends CandidateRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async findByUserId(userId: string): Promise<Candidate | null> {
    const [row] = await this.db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, userId))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findProfileByUserId(userId: string): Promise<CandidateProfile | null> {
    const [row] = await this.db
      .select({
        userId: candidates.userId,
        email: users.email,
        cpf: users.cpf,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        onboardingCompleted: users.onboardingCompleted,
        universityOfOrigin: candidates.universityOfOrigin,
        ira: candidates.ira,
        poscomp: candidates.poscomp,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(eq(candidates.userId, userId))
      .limit(1);

    return row ? this.toProfile(row) : null;
  }

  async findAllByFilters(filters: FindCandidatesDto): Promise<PaginatedResult<CandidateProfile>> {
    const conditions: SQL[] = [];
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    if (filters.userId) {
      conditions.push(eq(candidates.userId, filters.userId));
    }
    if (filters.email) {
      conditions.push(ilike(users.email, `%${filters.email}%`));
    }
    if (filters.cpf) {
      conditions.push(eq(users.cpf, filters.cpf));
    }
    if (filters.firstName) {
      conditions.push(ilike(users.firstName, `%${filters.firstName}%`));
    }
    if (filters.lastName) {
      conditions.push(ilike(users.lastName, `%${filters.lastName}%`));
    }
    if (filters.status) {
      conditions.push(eq(users.status, filters.status));
    }
    if (filters.onboardingCompleted !== undefined) {
      conditions.push(eq(users.onboardingCompleted, filters.onboardingCompleted));
    }
    if (filters.universityOfOrigin) {
      conditions.push(ilike(candidates.universityOfOrigin, `%${filters.universityOfOrigin}%`));
    }
    if (filters.iraMin !== undefined) {
      conditions.push(gte(sql`${candidates.ira}::numeric`, String(filters.iraMin)));
    }
    if (filters.iraMax !== undefined) {
      conditions.push(lte(sql`${candidates.ira}::numeric`, String(filters.iraMax)));
    }
    if (filters.poscompMin !== undefined) {
      conditions.push(gte(candidates.poscomp, filters.poscompMin));
    }
    if (filters.poscompMax !== undefined) {
      conditions.push(lte(candidates.poscomp, filters.poscompMax));
    }

    const rows = await this.db
      .select({
        userId: candidates.userId,
        email: users.email,
        cpf: users.cpf,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        onboardingCompleted: users.onboardingCompleted,
        universityOfOrigin: candidates.universityOfOrigin,
        ira: candidates.ira,
        poscomp: candidates.poscomp,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(users.firstName, users.lastName, candidates.userId)
      .limit(limit)
      .offset(offset);

    const [totalRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(conditions.length ? and(...conditions) : undefined);

    return buildPaginatedResult({
      data: rows.map(row => this.toProfile(row)),
      page,
      limit,
      total: totalRow?.count ?? 0,
    });
  }

  async upsertByUserId(params: {
    userId: string;
    universityOfOrigin: string;
    ira?: string | null;
    poscomp?: number | null;
  }): Promise<Candidate> {
    const [row] = await this.db
      .insert(candidates)
      .values({
        userId: params.userId,
        universityOfOrigin: params.universityOfOrigin,
        ira: params.ira ?? null,
        poscomp: params.poscomp ?? null,
      })
      .onConflictDoUpdate({
        target: candidates.userId,
        set: {
          universityOfOrigin: params.universityOfOrigin,
          ira: params.ira ?? null,
          poscomp: params.poscomp ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.toDomain(row);
  }

  private toDomain(row: CandidateRow): Candidate {
    return {
      userId: row.userId,
      universityOfOrigin: row.universityOfOrigin,
      ira: row.ira,
      poscomp: row.poscomp,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toProfile(row: {
    userId: string;
    email: string | null;
    cpf: string | null;
    firstName: string | null;
    lastName: string | null;
    role: typeof users.$inferSelect.role;
    status: typeof users.$inferSelect.status;
    onboardingCompleted: boolean;
    universityOfOrigin: string;
    ira: string | null;
    poscomp: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): CandidateProfile {
    return {
      userId: row.userId,
      email: row.email,
      cpf: row.cpf,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role as RoleEnum,
      status: row.status as StatusEnum,
      onboardingCompleted: row.onboardingCompleted,
      universityOfOrigin: row.universityOfOrigin,
      ira: row.ira,
      poscomp: row.poscomp,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
