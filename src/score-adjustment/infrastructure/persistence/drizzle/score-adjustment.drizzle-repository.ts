import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import type {
  ScoreAdjustmentInsert,
  ScoreAdjustmentSelect,
} from '../../../../database/schema/score-adjustments.js';
import { scoreAdjustments } from '../../../../database/schema/score-adjustments.js';
import { ScoreAdjustmentRepository } from '../score-adjustment.repository.js';

@Injectable()
export class ScoreAdjustmentDrizzleRepository extends ScoreAdjustmentRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async findByEnrollment(enrollmentId: string): Promise<ScoreAdjustmentSelect[]> {
    return this.db
      .select()
      .from(scoreAdjustments)
      .where(eq(scoreAdjustments.enrollmentId, enrollmentId))
      .orderBy(scoreAdjustments.createdAt);
  }

  async findByType(
    enrollmentId: string,
    scoreType: 'cv_score' | 'ira' | 'final',
  ): Promise<ScoreAdjustmentSelect | null> {
    const [row] = await this.db
      .select()
      .from(scoreAdjustments)
      .where(
        and(
          eq(scoreAdjustments.enrollmentId, enrollmentId),
          eq(scoreAdjustments.scoreType, scoreType),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async upsert(data: ScoreAdjustmentInsert): Promise<ScoreAdjustmentSelect> {
    const [row] = await this.db
      .insert(scoreAdjustments)
      .values(data)
      .onConflictDoUpdate({
        target: [scoreAdjustments.enrollmentId, scoreAdjustments.scoreType],
        set: {
          adjustedValue: data.adjustedValue,
          justification: data.justification,
          adjustedBy: data.adjustedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async delete(enrollmentId: string, scoreType: 'cv_score' | 'ira' | 'final'): Promise<void> {
    await this.db
      .delete(scoreAdjustments)
      .where(
        and(
          eq(scoreAdjustments.enrollmentId, enrollmentId),
          eq(scoreAdjustments.scoreType, scoreType),
        ),
      );
  }

  async lockAll(enrollmentId: string): Promise<void> {
    await this.db
      .update(scoreAdjustments)
      .set({ isLocked: true })
      .where(eq(scoreAdjustments.enrollmentId, enrollmentId));
  }
}
