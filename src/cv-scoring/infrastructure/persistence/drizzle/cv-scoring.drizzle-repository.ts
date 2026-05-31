import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import type { CvScoringCategorySelect } from '../../../../database/schema/cv-scoring';
import { cvScoringCategories } from '../../../../database/schema/cv-scoring';
import { CvScoringRepository } from '../cv-scoring.repository';

@Injectable()
export class CvScoringDrizzleRepository extends CvScoringRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async findByPeriodAndLevel(periodId: string, level: string): Promise<CvScoringCategorySelect[]> {
    return this.db
      .select()
      .from(cvScoringCategories)
      .where(
        and(
          eq(cvScoringCategories.enrollmentPeriodId, periodId),
          eq(cvScoringCategories.level, level as 'masters' | 'doctoral'),
        ),
      )
      .orderBy(cvScoringCategories.sortOrder);
  }
}
