import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import { CvScoringCategoryService } from './cv-scoring-category.service';

describe('CvScoringCategoryService', () => {
  let service: CvScoringCategoryService;
  let mockDb: any;

  const now = new Date();

  const mockCategory = {
    id: 'cat-uuid',
    enrollmentPeriodId: 'period-uuid',
    name: 'Projetos de pesquisa e IC',
    description: null,
    pointsPerItem: '0.50',
    maxPoints: '2.00',
    level: 'masters',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      orderBy: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockCategory]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module = await Test.createTestingModule({
      providers: [CvScoringCategoryService, { provide: DRIZZLE_TX, useValue: mockDb }],
    }).compile();

    service = module.get<CvScoringCategoryService>(CvScoringCategoryService);
  });

  describe('create', () => {
    it('creates a category successfully', async () => {
      const dto = {
        name: 'Projetos de pesquisa e IC',
        pointsPerItem: 0.5,
        maxPoints: 2.0,
        level: 'masters' as const,
      };

      const result = await service.create('period-uuid', dto);

      expect(result.id).toBe(mockCategory.id);
      expect(result.name).toBe(mockCategory.name);
      expect(result.enrollmentPeriodId).toBe('period-uuid');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('findByPeriodAndLevel', () => {
    it('returns categories for a period and level', async () => {
      mockDb.orderBy.mockResolvedValueOnce([mockCategory]);

      const result = await service.findByPeriodAndLevel('period-uuid', 'masters');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockCategory.name);
      expect(result[0].level).toBe('masters');
    });

    it('returns empty array when no categories exist', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await service.findByPeriodAndLevel('period-uuid', 'masters');

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns category when found', async () => {
      mockDb.limit.mockResolvedValueOnce([mockCategory]);

      const result = await service.findById('cat-uuid');

      expect(result.id).toBe(mockCategory.id);
      expect(result.name).toBe(mockCategory.name);
    });

    it('throws NotFoundException when category not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a category successfully', async () => {
      // findById returns the category
      mockDb.limit.mockResolvedValueOnce([mockCategory]);

      const updatedCategory = { ...mockCategory, name: 'Updated Name' };
      mockDb.returning.mockResolvedValueOnce([updatedCategory]);

      const result = await service.update('cat-uuid', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when updating non-existent category', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.update('missing-uuid', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes a category successfully', async () => {
      // findById returns the category
      mockDb.limit.mockResolvedValueOnce([mockCategory]);

      await expect(service.remove('cat-uuid')).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when removing non-existent category', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.remove('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('copyFromPeriod', () => {
    it('copies categories from source to target period', async () => {
      const sourceCategories = [
        mockCategory,
        { ...mockCategory, id: 'cat-uuid-2', name: 'Publicações', sortOrder: 1 },
      ];

      // select from source
      mockDb.where.mockResolvedValueOnce(sourceCategories);

      const copiedCategories = sourceCategories.map((cat, i) => ({
        ...cat,
        id: `new-cat-${i}`,
        enrollmentPeriodId: 'target-period',
      }));
      mockDb.returning.mockResolvedValueOnce(copiedCategories);

      const result = await service.copyFromPeriod('source-period', 'target-period');

      expect(result).toHaveLength(2);
      expect(result[0].enrollmentPeriodId).toBe('target-period');
      expect(result[1].enrollmentPeriodId).toBe('target-period');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('throws NotFoundException when source period has no categories', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      await expect(service.copyFromPeriod('empty-period', 'target-period')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
