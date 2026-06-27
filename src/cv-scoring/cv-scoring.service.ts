import { Injectable } from '@nestjs/common';
import type { CvScoringCategorySelect } from '../database/schema/cv-scoring';
import {
  BASE_CV_SCORE,
  QUALIS_POINTS,
  type CapesClassification,
} from './constants/cv-scoring-config';
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
  /** Pontuação obtida pelo candidato nas categorias (sem a base). */
  total: number;
  /** Pontuação-base do currículo (BASE_CV_SCORE). */
  base: number;
  /** Nota final do CV: base + total. */
  finalScore: number;
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

  calculateItemScore(
    item: CvItemForScoring,
    category: CvScoringCategorySelect,
    useVerification = true,
  ): number {
    const key = this.getCategoryKey(category.name);
    const level = category.level;

    const isVerified = useVerification ? item.isVerified : 'pending';
    const correctedClassification = useVerification ? item.correctedClassification : null;

    // If marked as incorrect and set no correction, it scores 0
    if (isVerified === 'incorrect' && !correctedClassification) {
      return 0;
    }

    const activeClassification =
      isVerified === 'incorrect' && correctedClassification
        ? correctedClassification
        : item.classification || 'none';

    switch (key) {
      case 'PROJECTS': {
        const basePoints = level === 'masters' ? 0.3 : 0.2;
        const areaBonus = level === 'masters' ? 0.2 : 0.1;
        const pointsPerSemester = basePoints + (item.isInArea ? areaBonus : 0);
        return item.quantity * pointsPerSemester;
      }

      case 'PRODUCTION': {
        if (level === 'masters' && item.isEncontroIc) {
          return 0.1;
        } else {
          // Base score from CAPES classification
          const qualisClass = activeClassification as CapesClassification;
          const basePoints = QUALIS_POINTS.classifications[qualisClass] ?? 0.1;
          let itemScore = basePoints;

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
          return itemScore;
        }
      }

      case 'TEACHING': {
        if (level === 'masters') {
          const points = item.docenciaType === 'ies' ? 0.3 : 0.2;
          return item.quantity * points;
        } else {
          return item.quantity * 0.2;
        }
      }

      case 'ORIENTATION': {
        if (level === 'doctoral') {
          return item.quantity * 0.2;
        }
        return 0;
      }

      case 'EVENTS': {
        const type = item.eventoType || 'local';
        const points = type === 'internacional' ? 0.3 : type === 'nacional' ? 0.2 : 0.1;
        return item.quantity * points;
      }

      default: {
        const pointsPerItem = parseFloat(category.pointsPerItem);
        return item.quantity * pointsPerItem;
      }
    }
  }

  calculateCategoryScore(
    items: CvItemForScoring[],
    category: CvScoringCategorySelect,
    useVerification = true,
  ): number {
    const maxPoints = parseFloat(category.maxPoints);
    let totalScore = 0;

    for (const item of items) {
      totalScore += this.calculateItemScore(item, category, useVerification);
    }

    return parseFloat(Math.min(totalScore, maxPoints).toFixed(2));
  }

  calculateScoreFromItems(
    items: CvItemForScoring[],
    categories: CvScoringCategorySelect[],
    useVerification = true,
  ): ScoreBreakdown {
    const categoryBreakdown: CategoryScoreBreakdown[] = [];
    let total = 0;

    for (const category of categories) {
      const categoryItems = items.filter(item => item.scoringCategoryId === category.id);

      const score = this.calculateCategoryScore(categoryItems, category, useVerification);
      categoryBreakdown.push({
        categoryId: category.id,
        name: category.name,
        score,
        maxPoints: parseFloat(category.maxPoints),
      });

      total += score;
    }

    const earned = parseFloat(total.toFixed(2));
    return {
      categories: categoryBreakdown,
      total: earned,
      base: BASE_CV_SCORE,
      finalScore: parseFloat((BASE_CV_SCORE + earned).toFixed(2)),
    };
  }
}
