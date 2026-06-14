import { Injectable } from '@nestjs/common';
import type { CvScoringCategorySelect } from '../database/schema/cv-scoring';
import { QUALIS_POINTS, type CapesClassification } from './constants/cv-scoring-config';
import { CvScoringRepository } from './infrastructure/persistence/cv-scoring.repository';

export interface CvItemForScoring {
  id: string;
  scoringCategoryId: string;
  quantity: number;
  classification: string | null;
  isComplete: boolean;
  isResumo: boolean;
  isPeriodico: boolean;
  isAutorPrincipal: boolean;
  isDissertacao: boolean;
  isEncontroIc: boolean;
  isInArea: boolean;
  docenciaType: string | null;
  eventoType: string | null;
  isVerified: string;
  correctedClassification: string | null;
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
  constructor(private readonly cvScoringRepository: CvScoringRepository) {}

  async getCategoriesForPeriod(
    periodId: string,
    level: string,
  ): Promise<CvScoringCategorySelect[]> {
    return this.cvScoringRepository.findByPeriodAndLevel(periodId, level);
  }

  getCategoryKey(name: string): string {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('projeto') || normalized.includes('participação de projetos'))
      return 'PROJECTS';
    if (normalized.includes('produção científica') || normalized.includes('producao cientifica'))
      return 'PRODUCTION';
    if (
      normalized.includes('docência') ||
      normalized.includes('docencia') ||
      normalized.includes('docente')
    )
      return 'TEACHING';
    if (normalized.includes('orientação') || normalized.includes('orientacao'))
      return 'ORIENTATION';
    if (
      normalized.includes('apresentação') ||
      normalized.includes('apresentacao') ||
      normalized.includes('evento')
    )
      return 'EVENTS';
    return 'UNKNOWN';
  }

  calculateCategoryScore(items: CvItemForScoring[], category: CvScoringCategorySelect): number {
    const maxPoints = parseFloat(category.maxPoints);
    const key = this.getCategoryKey(category.name);
    const level = category.level;

    let totalScore = 0;

    for (const item of items) {
      // If professor marked as incorrect and set no correction, it scores 0
      if (item.isVerified === 'incorrect' && !item.correctedClassification) {
        continue;
      }

      const activeClassification =
        item.isVerified === 'incorrect' && item.correctedClassification
          ? item.correctedClassification
          : item.classification || 'none';

      switch (key) {
        case 'PROJECTS': {
          const basePoints = level === 'masters' ? 0.3 : 0.2;
          const areaBonus = level === 'masters' ? 0.2 : 0.1;
          const pointsPerSemester = basePoints + (item.isInArea ? areaBonus : 0);
          totalScore += item.quantity * pointsPerSemester;
          break;
        }

        case 'PRODUCTION': {
          let itemScore = 0;
          if (level === 'masters' && item.isEncontroIc) {
            itemScore = 0.1; // Encontro de IC is a flat 0.1 points with no bonuses
          } else {
            // Base score from CAPES classification
            const qualisClass = activeClassification as CapesClassification;
            const basePoints = QUALIS_POINTS.classifications[qualisClass] ?? 0.1;
            itemScore = basePoints;

            // Cumulative bonuses
            if (item.isComplete) {
              itemScore += QUALIS_POINTS.bonuses.completeArticle;
            } else if (item.isResumo) {
              itemScore += QUALIS_POINTS.bonuses.summaryPoster;
            }

            if (item.isPeriodico) {
              itemScore += QUALIS_POINTS.bonuses.periodical;
            }

            if (item.isAutorPrincipal) {
              itemScore += QUALIS_POINTS.bonuses.mainAuthor;
            }

            if (level === 'doctoral' && item.isDissertacao) {
              itemScore += QUALIS_POINTS.bonuses.dissertationOutcome;
            }
          }
          totalScore += itemScore;
          break;
        }

        case 'TEACHING': {
          if (level === 'masters') {
            const points = item.docenciaType === 'ies' ? 0.3 : 0.2;
            totalScore += item.quantity * points;
          } else {
            totalScore += item.quantity * 0.2;
          }
          break;
        }

        case 'ORIENTATION': {
          if (level === 'doctoral') {
            totalScore += item.quantity * 0.2;
          }
          break;
        }

        case 'EVENTS': {
          const type = item.eventoType || 'local';
          const points = type === 'internacional' ? 0.3 : type === 'nacional' ? 0.2 : 0.1;
          totalScore += item.quantity * points;
          break;
        }

        default: {
          const pointsPerItem = parseFloat(category.pointsPerItem);
          totalScore += item.quantity * pointsPerItem;
          break;
        }
      }
    }

    return parseFloat(Math.min(totalScore, maxPoints).toFixed(2));
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

    return { categories: categoryBreakdown, total: parseFloat(total.toFixed(2)) };
  }
}
