import type { CvScoringCategorySelect } from '../../../database/schema/cv-scoring';

export abstract class CvScoringRepository {
  abstract findByPeriodAndLevel(
    periodId: string,
    level: string,
  ): Promise<CvScoringCategorySelect[]>;
}
