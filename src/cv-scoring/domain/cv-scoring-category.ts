export class CvScoringCategory {
  id!: string;
  enrollmentPeriodId!: string;
  name!: string;
  description!: string | null;
  pointsPerItem!: string;
  maxPoints!: string;
  level!: string;
  sortOrder!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, unknown>): CvScoringCategory {
    const entity = new CvScoringCategory();
    const r = row as unknown as CvScoringCategory;
    entity.id = r.id;
    entity.enrollmentPeriodId = r.enrollmentPeriodId;
    entity.name = r.name;
    entity.description = r.description;
    entity.pointsPerItem = r.pointsPerItem;
    entity.maxPoints = r.maxPoints;
    entity.level = r.level;
    entity.sortOrder = r.sortOrder;
    entity.createdAt = r.createdAt;
    entity.updatedAt = r.updatedAt;
    return entity;
  }
}
