export class ScoreAdjustment {
  id!: string;
  enrollmentId!: string;
  adjustedBy!: string;
  scoreType!: 'cv_score' | 'ira' | 'final';
  originalValue!: string;
  adjustedValue!: string;
  justification!: string;
  isLocked!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, unknown>): ScoreAdjustment {
    const entity = new ScoreAdjustment();
    Object.assign(entity, row);
    return entity;
  }
}
