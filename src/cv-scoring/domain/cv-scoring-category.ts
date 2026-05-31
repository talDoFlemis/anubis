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

  static toDomain(row: Record<string, any>): CvScoringCategory {
    const entity = new CvScoringCategory();
    entity.id = row.id;
    entity.enrollmentPeriodId = row.enrollmentPeriodId;
    entity.name = row.name;
    entity.description = row.description;
    entity.pointsPerItem = row.pointsPerItem;
    entity.maxPoints = row.maxPoints;
    entity.level = row.level;
    entity.sortOrder = row.sortOrder;
    entity.createdAt = row.createdAt;
    entity.updatedAt = row.updatedAt;
    return entity;
  }
}
