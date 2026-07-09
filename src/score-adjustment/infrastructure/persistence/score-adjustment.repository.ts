import type {
  ScoreAdjustmentInsert,
  ScoreAdjustmentSelect,
} from '../../../database/schema/score-adjustments.js';

export abstract class ScoreAdjustmentRepository {
  abstract findByEnrollment(enrollmentId: string): Promise<ScoreAdjustmentSelect[]>;
  abstract findByType(
    enrollmentId: string,
    scoreType: 'cv_score' | 'ira' | 'final',
  ): Promise<ScoreAdjustmentSelect | null>;
  abstract upsert(data: ScoreAdjustmentInsert): Promise<ScoreAdjustmentSelect>;
  abstract delete(enrollmentId: string, scoreType: 'cv_score' | 'ira' | 'final'): Promise<void>;
  abstract lockAll(enrollmentId: string): Promise<void>;
}
