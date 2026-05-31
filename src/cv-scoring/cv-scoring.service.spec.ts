import { Test } from '@nestjs/testing';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { CvScoringCategorySelect } from '../database/schema/cv-scoring';
import type { CvItemForScoring, ScoreBreakdown } from './cv-scoring.service';
import { CvScoringService } from './cv-scoring.service';

describe('CvScoringService', () => {
  let service: CvScoringService;
  let mockDb: any;

  const now = new Date();

  function makeCategory(overrides: Partial<CvScoringCategorySelect> = {}): CvScoringCategorySelect {
    return {
      id: 'cat-1',
      enrollmentPeriodId: 'period-1',
      name: 'Test Category',
      description: null,
      pointsPerItem: '0.50',
      maxPoints: '2.00',
      level: 'masters',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [CvScoringService, { provide: DRIZZLE_TX, useValue: mockDb }],
    }).compile();

    service = module.get<CvScoringService>(CvScoringService);
  });

  describe('calculateCategoryScore', () => {
    it('calculates correct score for items below max', () => {
      const category = makeCategory({
        pointsPerItem: '0.50',
        maxPoints: '2.00',
      });
      const items: CvItemForScoring[] = [{ scoringCategoryId: 'cat-1', quantity: 3 }];

      const score = service.calculateCategoryScore(items, category);

      expect(score).toBe(1.5);
    });

    it('caps score at maxPoints when items exceed max', () => {
      const category = makeCategory({
        pointsPerItem: '0.50',
        maxPoints: '2.00',
      });
      const items: CvItemForScoring[] = [{ scoringCategoryId: 'cat-1', quantity: 10 }];

      const score = service.calculateCategoryScore(items, category);

      expect(score).toBe(2.0);
    });

    it('returns 0 for empty items', () => {
      const category = makeCategory();

      const score = service.calculateCategoryScore([], category);

      expect(score).toBe(0);
    });

    it('sums quantity across multiple items', () => {
      const category = makeCategory({
        pointsPerItem: '1.00',
        maxPoints: '5.00',
      });
      const items: CvItemForScoring[] = [
        { scoringCategoryId: 'cat-1', quantity: 2 },
        { scoringCategoryId: 'cat-1', quantity: 1 },
      ];

      const score = service.calculateCategoryScore(items, category);

      expect(score).toBe(3.0);
    });
  });

  describe('calculateScoreFromItems', () => {
    it('calculates correct breakdown and total for multiple categories', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({
          id: 'cat-1',
          name: 'Pesquisa',
          pointsPerItem: '0.50',
          maxPoints: '2.00',
        }),
        makeCategory({
          id: 'cat-2',
          name: 'Publicações',
          pointsPerItem: '1.00',
          maxPoints: '3.00',
        }),
      ];

      const items: CvItemForScoring[] = [
        { scoringCategoryId: 'cat-1', quantity: 3 },
        { scoringCategoryId: 'cat-2', quantity: 2 },
      ];

      const result: ScoreBreakdown = service.calculateScoreFromItems(items, categories);

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0]).toEqual({
        categoryId: 'cat-1',
        name: 'Pesquisa',
        score: 1.5,
        maxPoints: 2.0,
      });
      expect(result.categories[1]).toEqual({
        categoryId: 'cat-2',
        name: 'Publicações',
        score: 2.0,
        maxPoints: 3.0,
      });
      expect(result.total).toBe(3.5);
    });

    it('returns all zeros when no items are provided', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({ id: 'cat-1', name: 'Pesquisa' }),
        makeCategory({ id: 'cat-2', name: 'Publicações' }),
      ];

      const result = service.calculateScoreFromItems([], categories);

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].score).toBe(0);
      expect(result.categories[1].score).toBe(0);
      expect(result.total).toBe(0);
    });

    it('returns empty breakdown when no categories exist', () => {
      const items: CvItemForScoring[] = [{ scoringCategoryId: 'cat-1', quantity: 5 }];

      const result = service.calculateScoreFromItems(items, []);

      expect(result.categories).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("master's scoring scenarios", () => {
    it('scores master-level categories correctly', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({
          id: 'masters-1',
          name: 'Projetos de pesquisa e IC',
          pointsPerItem: '0.50',
          maxPoints: '2.00',
          level: 'masters',
        }),
        makeCategory({
          id: 'masters-2',
          name: 'Publicações em conferências',
          pointsPerItem: '0.75',
          maxPoints: '1.50',
          level: 'masters',
        }),
      ];

      const items: CvItemForScoring[] = [
        { scoringCategoryId: 'masters-1', quantity: 4 },
        { scoringCategoryId: 'masters-2', quantity: 3 },
      ];

      const result = service.calculateScoreFromItems(items, categories);

      // 4 * 0.50 = 2.00 (capped at 2.00)
      expect(result.categories[0].score).toBe(2.0);
      // 3 * 0.75 = 2.25 (capped at 1.50)
      expect(result.categories[1].score).toBe(1.5);
      expect(result.total).toBe(3.5);
    });
  });

  describe('doctoral scoring scenarios', () => {
    it('scores doctoral-level categories correctly', () => {
      const categories: CvScoringCategorySelect[] = [
        makeCategory({
          id: 'doc-1',
          name: 'Artigos em periódicos',
          pointsPerItem: '0.25',
          maxPoints: '1.50',
          level: 'doctoral',
        }),
        makeCategory({
          id: 'doc-2',
          name: 'Orientações concluídas',
          pointsPerItem: '0.50',
          maxPoints: '2.00',
          level: 'doctoral',
        }),
      ];

      const items: CvItemForScoring[] = [
        { scoringCategoryId: 'doc-1', quantity: 4 },
        { scoringCategoryId: 'doc-2', quantity: 3 },
      ];

      const result = service.calculateScoreFromItems(items, categories);

      // 4 * 0.25 = 1.00 (within 1.50 cap)
      expect(result.categories[0].score).toBe(1.0);
      // 3 * 0.50 = 1.50 (within 2.00 cap)
      expect(result.categories[1].score).toBe(1.5);
      expect(result.total).toBe(2.5);
    });

    it('caps doctoral scores at maxPoints', () => {
      const category = makeCategory({
        id: 'doc-1',
        pointsPerItem: '0.25',
        maxPoints: '1.50',
        level: 'doctoral',
      });

      const items: CvItemForScoring[] = [{ scoringCategoryId: 'doc-1', quantity: 10 }];

      // 10 * 0.25 = 2.50 → capped at 1.50
      const score = service.calculateCategoryScore(items, category);

      expect(score).toBe(1.5);
    });
  });

  describe('getCategoriesForPeriod', () => {
    it('queries the database for categories by period and level', async () => {
      const expected = [makeCategory()];
      mockDb.orderBy.mockResolvedValueOnce(expected);

      const result = await service.getCategoriesForPeriod('period-1', 'masters');

      expect(result).toEqual(expected);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
