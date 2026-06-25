import { Test } from '@nestjs/testing';
import type { CvScoringCategorySelect } from '../database/schema/cv-scoring';
import { CvScoringService, type CvItemForScoring } from './cv-scoring.service';
import { CvScoringRepository } from './infrastructure/persistence/cv-scoring.repository';

describe('CvScoringService', () => {
  let service: CvScoringService;
  let mockRepository: Record<string, jest.Mock>;

  const now = new Date();

  function makeCategory(overrides: Partial<CvScoringCategorySelect> = {}): CvScoringCategorySelect {
    return {
      id: 'cat-1',
      enrollmentPeriodId: 'period-1',
      name: 'Participação em projetos de pesquisa',
      description: null,
      pointsPerItem: '0.00',
      maxPoints: '2.00',
      level: 'masters',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  function makeItem(overrides: Partial<CvItemForScoring> = {}): CvItemForScoring {
    return {
      id: 'item-1',
      scoringCategoryId: 'cat-1',
      quantity: 1,
      classification: 'none',
      isComplete: false,
      isResumo: false,
      isPeriodico: false,
      isAutorPrincipal: false,
      isDissertacao: false,
      isEncontroIc: false,
      isInArea: false,
      docenciaType: null,
      eventoType: null,
      isVerified: 'pending',
      correctedClassification: null,
      ...overrides,
    };
  }

  beforeEach(async () => {
    mockRepository = {
      findByPeriodAndLevel: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [CvScoringService, { provide: CvScoringRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<CvScoringService>(CvScoringService);
  });

  describe('calculateCategoryScore', () => {
    it('calculates correct score for PROJECTS below max', () => {
      const category = makeCategory({
        name: 'Participação em projetos de pesquisa',
        level: 'masters',
        maxPoints: '2.00',
      });
      const items: CvItemForScoring[] = [
        makeItem({ quantity: 3, isInArea: true }), // (0.3 + 0.2) * 3 = 1.5
      ];

      const score = service.calculateCategoryScore(items, category);

      expect(score).toBe(1.5);
    });

    it('caps PROJECTS score at maxPoints when items exceed max', () => {
      const category = makeCategory({
        name: 'Participação em projetos de pesquisa',
        level: 'masters',
        maxPoints: '2.00',
      });
      const items: CvItemForScoring[] = [
        makeItem({ quantity: 10, isInArea: true }), // (0.3 + 0.2) * 10 = 5.0 -> capped at 2.0
      ];

      const score = service.calculateCategoryScore(items, category);

      expect(score).toBe(2.0);
    });

    it('returns 0 for empty items', () => {
      const category = makeCategory();

      const score = service.calculateCategoryScore([], category);

      expect(score).toBe(0);
    });
  });

  describe('calculateScoreFromItems', () => {
    it('calculates correct breakdown and total for multiple categories', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({
          id: 'cat-1',
          name: 'Participação em projetos de pesquisa',
          maxPoints: '2.00',
          level: 'masters',
        }),
        makeCategory({
          id: 'cat-2',
          name: 'Produção científica',
          maxPoints: '1.00',
          level: 'masters',
        }),
      ];

      const items: CvItemForScoring[] = [
        makeItem({ scoringCategoryId: 'cat-1', quantity: 3, isInArea: false }), // 3 * 0.3 = 0.9
        makeItem({
          scoringCategoryId: 'cat-2',
          classification: 'A1', // 0.6
          isComplete: true, // +0.2
          isPeriodico: true, // +0.2
          isAutorPrincipal: true, // +0.2
          // Total = 1.2 -> capped at 1.0
        }),
      ];

      const result = service.calculateScoreFromItems(items, categories);

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].score).toBe(0.9);
      expect(result.categories[1].score).toBe(1.0);
      expect(result.total).toBe(1.9);
      expect(result.base).toBe(6);
      expect(result.finalScore).toBe(7.9);
    });
  });

  describe("master's scoring scenarios", () => {
    it('scores master-level categories correctly', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({
          id: 'masters-projects',
          name: 'Participação em projetos de pesquisa e iniciação científica',
          maxPoints: '2.00',
          level: 'masters',
        }),
        makeCategory({
          id: 'masters-teaching',
          name: 'Atividade de docência ou iniciação à docência',
          maxPoints: '0.50',
          level: 'masters',
        }),
      ];

      const items: CvItemForScoring[] = [
        makeItem({ scoringCategoryId: 'masters-projects', quantity: 4, isInArea: true }), // 4 * (0.3 + 0.2) = 2.0
        makeItem({ scoringCategoryId: 'masters-teaching', quantity: 2, docenciaType: 'ies' }), // 2 * 0.3 = 0.6 -> capped at 0.5
      ];

      const result = service.calculateScoreFromItems(items, categories);

      expect(result.categories[0].score).toBe(2.0);
      expect(result.categories[1].score).toBe(0.5);
      expect(result.total).toBe(2.5);
    });
  });

  describe('doctoral scoring scenarios', () => {
    it('scores doctoral-level categories correctly', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({
          id: 'doc-projects',
          name: 'Participação em projetos de pesquisa',
          maxPoints: '1.00',
          level: 'doctoral',
        }),
        makeCategory({
          id: 'doc-orientation',
          name: 'Orientação de iniciação científica',
          maxPoints: '0.50',
          level: 'doctoral',
        }),
      ];

      const items: CvItemForScoring[] = [
        makeItem({ scoringCategoryId: 'doc-projects', quantity: 4, isInArea: false }), // 4 * 0.2 = 0.8
        makeItem({ scoringCategoryId: 'doc-orientation', quantity: 2 }), // 2 * 0.2 = 0.4
      ];

      const result = service.calculateScoreFromItems(items, categories);

      expect(result.categories[0].score).toBe(0.8);
      expect(result.categories[1].score).toBe(0.4);
      expect(result.total).toBe(1.2);
    });
  });
});
