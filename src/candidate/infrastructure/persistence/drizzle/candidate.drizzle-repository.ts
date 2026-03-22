import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { candidates } from '../../../../database/schema/candidates';
import { Candidate } from '../../../domain/candidate';
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
}
