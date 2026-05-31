import type { CvScoringCategory } from '../../domain/cv-scoring-category';
import type { CreateCvScoringCategoryDto } from '../../dto/create-cv-scoring-category.dto';
import type { UpdateCvScoringCategoryDto } from '../../dto/update-cv-scoring-category.dto';

export abstract class CvScoringCategoryRepository {
  abstract create(periodId: string, dto: CreateCvScoringCategoryDto): Promise<CvScoringCategory>;

  abstract findByPeriodAndLevel(periodId: string, level: string): Promise<CvScoringCategory[]>;

  abstract findAllByPeriod(periodId: string): Promise<CvScoringCategory[]>;

  abstract findById(id: string): Promise<CvScoringCategory | null>;

  abstract update(id: string, dto: UpdateCvScoringCategoryDto): Promise<CvScoringCategory>;

  abstract remove(id: string): Promise<void>;

  abstract copyFromPeriod(
    sourcePeriodId: string,
    targetPeriodId: string,
  ): Promise<CvScoringCategory[]>;
}
