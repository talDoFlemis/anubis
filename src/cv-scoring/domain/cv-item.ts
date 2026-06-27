export class CvItem {
  id!: string;
  enrollmentId!: string;
  scoringCategoryId!: string;
  description!: string;
  quantity!: number;
  proofFileId!: string | null;
  proofFileName!: string | null;
  score!: string | null;
  validatedScore!: string | null;
  classification!: string | null;
  isComplete!: boolean;
  isResumo!: boolean;
  isPeriodico!: boolean;
  isAutorPrincipal!: boolean;
  isDissertacao!: boolean;
  isEncontroIc!: boolean;
  isInArea!: boolean;
  docenciaType!: string | null;
  eventoType!: string | null;
  isVerified!: string;
  correctedClassification!: string | null;
  verificationComment!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, unknown>): CvItem {
    const entity = new CvItem();
    Object.assign(entity, row);
    return entity;
  }
}
