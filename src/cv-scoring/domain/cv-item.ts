export class CvItem {
  id!: string;
  enrollmentId!: string;
  scoringCategoryId!: string;
  description!: string;
  quantity!: number;
  proofFileId!: string | null;
  proofFileName!: string | null;
  score!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, unknown>): CvItem {
    const entity = new CvItem();
    Object.assign(entity, row);
    return entity;
  }
}
