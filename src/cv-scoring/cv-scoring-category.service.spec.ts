import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CvScoringCategoryService } from './cv-scoring-category.service';
import { CvScoringCategoryRepository } from './infrastructure/persistence/cv-scoring-category.repository';

describe('CvScoringCategoryService', () => {
  let service: CvScoringCategoryService;
  let mockRepository: Record<string, jest.Mock>;

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
    mockRepository = {
      create: jest.fn().mockResolvedValue(mockCategory),
      findByPeriodAndLevel: jest.fn().mockResolvedValue([]),
      findAllByPeriod: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(mockCategory),
      remove: jest.fn().mockResolvedValue(undefined),
      copyFromPeriod: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [
        CvScoringCategoryService,
        { provide: CvScoringCategoryRepository, useValue: mockRepository },
      ],
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
      expect(mockRepository.create).toHaveBeenCalledWith('period-uuid', dto);
    });
  });

  describe('findByPeriodAndLevel', () => {
    it('returns categories for a period and level', async () => {
      mockRepository.findByPeriodAndLevel.mockResolvedValueOnce([mockCategory]);

      const result = await service.findByPeriodAndLevel('period-uuid', 'masters');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockCategory.name);
      expect(result[0].level).toBe('masters');
    });

    it('returns empty array when no categories exist', async () => {
      mockRepository.findByPeriodAndLevel.mockResolvedValueOnce([]);

      const result = await service.findByPeriodAndLevel('period-uuid', 'masters');

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns category when found', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockCategory);

      const result = await service.findById('cat-uuid');

      expect(result.id).toBe(mockCategory.id);
      expect(result.name).toBe(mockCategory.name);
    });

    it('throws NotFoundException when category not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a category successfully', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockCategory);

      const updatedCategory = { ...mockCategory, name: 'Updated Name' };
      mockRepository.update.mockResolvedValueOnce(updatedCategory);

      const result = await service.update('cat-uuid', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockRepository.update).toHaveBeenCalledWith('cat-uuid', { name: 'Updated Name' });
    });

    it('throws NotFoundException when updating non-existent category', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.update('missing-uuid', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes a category successfully', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockCategory);

      await expect(service.remove('cat-uuid')).resolves.toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalledWith('cat-uuid');
    });

    it('throws NotFoundException when removing non-existent category', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.remove('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('copyFromPeriod', () => {
    it('copies categories from source to target period', async () => {
      const copiedCategories = [
        { ...mockCategory, id: 'new-cat-0', enrollmentPeriodId: 'target-period' },
        {
          ...mockCategory,
          id: 'new-cat-1',
          name: 'Publicações',
          sortOrder: 1,
          enrollmentPeriodId: 'target-period',
        },
      ];
      mockRepository.copyFromPeriod.mockResolvedValueOnce(copiedCategories);

      const result = await service.copyFromPeriod('source-period', 'target-period');

      expect(result).toHaveLength(2);
      expect(result[0].enrollmentPeriodId).toBe('target-period');
      expect(result[1].enrollmentPeriodId).toBe('target-period');
      expect(mockRepository.copyFromPeriod).toHaveBeenCalledWith('source-period', 'target-period');
    });

    it('throws NotFoundException when source period has no categories', async () => {
      mockRepository.copyFromPeriod.mockResolvedValueOnce([]);

      await expect(service.copyFromPeriod('empty-period', 'target-period')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
