import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import type { CvScoringCategorySelect } from '../database/schema/cv-scoring';
import { cvScoringCategories } from '../database/schema/cv-scoring';

export interface CvItemForScoring {
  scoringCategoryId: string;
  quantity: number;
}

export interface CategoryScoreBreakdown {
  categoryId: string;
  name: string;
  score: number;
  maxPoints: number;
}

export interface ScoreBreakdown {
  categories: CategoryScoreBreakdown[];
  total: number;
}

@Injectable()
export class CvScoringService {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async getCategoriesForPeriod(
    periodId: string,
    level: string,
  ): Promise<CvScoringCategorySelect[]> {
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

  calculateCategoryScore(items: CvItemForScoring[], category: CvScoringCategorySelect): number {
    const pointsPerItem = parseFloat(category.pointsPerItem);
    const maxPoints = parseFloat(category.maxPoints);

    let totalQuantity = 0;
    for (const item of items) {
      totalQuantity += item.quantity;
    }

    const rawScore = totalQuantity * pointsPerItem;
    return Math.min(rawScore, maxPoints);
  }

  calculateScoreFromItems(
    items: CvItemForScoring[],
    categories: CvScoringCategorySelect[],
  ): ScoreBreakdown {
    const categoryBreakdown: CategoryScoreBreakdown[] = [];
    let total = 0;

    for (const category of categories) {
      const categoryItems = items.filter(item => item.scoringCategoryId === category.id);

      const score = this.calculateCategoryScore(categoryItems, category);
      categoryBreakdown.push({
        categoryId: category.id,
        name: category.name,
        score,
        maxPoints: parseFloat(category.maxPoints),
      });

      total += score;
    }

    return { categories: categoryBreakdown, total };
  }
}
