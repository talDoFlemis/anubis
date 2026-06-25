import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Readable } from 'stream';

import { FileStorageService } from '../file-storage/file-storage.service';
import { CvItemService } from './cv-item.service';
import { CvScoringService } from './cv-scoring.service';
import { CvItemRepository } from './infrastructure/persistence/cv-item.repository';

describe('CvItemService', () => {
  let service: CvItemService;
  let mockCvItemRepository: Record<string, jest.Mock>;
  let mockCvScoringService: Record<string, jest.Mock>;
  let mockFileStorageService: Record<string, jest.Mock>;

  const mockEnrollment = {
    id: 'enrollment-uuid',
    candidateId: 'user-uuid',
    enrollmentPeriodId: 'period-uuid',
    level: 'masters',
    status: 'draft',
    scoreDraft: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory = {
    id: 'category-uuid',
    enrollmentPeriodId: 'period-uuid',
    name: 'Publicações',
    pointsPerItem: '10.00',
    maxPoints: '30.00',
    level: 'masters',
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCvItem = {
    id: 'item-uuid',
    enrollmentId: 'enrollment-uuid',
    scoringCategoryId: 'category-uuid',
    description: 'Artigo publicado',
    quantity: 1,
    proofFileId: null,
    proofFileName: null,
    score: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'proof.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: null as unknown as Readable,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    mockCvItemRepository = {
      create: jest.fn().mockResolvedValue(mockCvItem),
      findByEnrollment: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(mockCvItem),
      remove: jest.fn().mockResolvedValue(undefined),
      findEnrollmentById: jest.fn().mockResolvedValue(null),
      findScoringCategoryById: jest.fn().mockResolvedValue(null),
      updateEnrollmentScore: jest.fn().mockResolvedValue(undefined),
    };

    mockCvScoringService = {
      getCategoriesForPeriod: jest.fn().mockResolvedValue([mockCategory]),
      calculateScoreFromItems: jest.fn().mockReturnValue({
        categories: [
          {
            categoryId: 'category-uuid',
            name: 'Publicações',
            score: 10,
            maxPoints: 30,
          },
        ],
        total: 10,
        base: 6,
        finalScore: 16,
      }),
    };

    mockFileStorageService = {
      upload: jest.fn().mockResolvedValue({ id: 'file-uuid', originalName: 'proof.pdf' }),
      delete: jest.fn().mockResolvedValue(undefined),
      getSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url'),
    };

    const module = await Test.createTestingModule({
      providers: [
        CvItemService,
        { provide: CvItemRepository, useValue: mockCvItemRepository },
        { provide: CvScoringService, useValue: mockCvScoringService },
        { provide: FileStorageService, useValue: mockFileStorageService },
      ],
    }).compile();

    service = module.get<CvItemService>(CvItemService);
  });

  /**
   * Helper to set up mocks for a successful create flow:
   *   1. getAndValidateEnrollment → findEnrollmentById
   *   2. validateScoringCategory → findScoringCategoryById
   *   3. create item
   *   4. recalculateScore → findEnrollmentById + findByEnrollment + updateEnrollmentScore
   */
  function setupCreateMocks(
    overrides: { enrollment?: unknown; category?: unknown; item?: unknown } = {},
  ) {
    const enrollment = overrides.enrollment ?? mockEnrollment;
    const category = overrides.category ?? mockCategory;
    const item = overrides.item ?? mockCvItem;

    mockCvItemRepository.findEnrollmentById
      .mockResolvedValueOnce(enrollment) // getAndValidateEnrollment
      .mockResolvedValueOnce(enrollment); // recalculateScore → getEnrollment

    mockCvItemRepository.findScoringCategoryById.mockResolvedValueOnce(category);
    mockCvItemRepository.create.mockResolvedValueOnce(item);
    mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([item]); // recalculateScore
  }

  describe('create', () => {
    it('creates a CV item successfully', async () => {
      setupCreateMocks();

      const result = await service.create('user-uuid', 'enrollment-uuid', {
        scoringCategoryId: 'category-uuid',
        description: 'Artigo publicado',
      });

      expect(result.id).toBe('item-uuid');
      expect(result.description).toBe('Artigo publicado');
      expect(mockCvItemRepository.create).toHaveBeenCalled();
    });

    it('creates a CV item with file upload', async () => {
      const itemWithFile = { ...mockCvItem, proofFileId: 'file-uuid' };
      setupCreateMocks({ item: itemWithFile });

      const result = await service.create(
        'user-uuid',
        'enrollment-uuid',
        {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        },
        mockFile,
      );

      expect(result.proofFileId).toBe('file-uuid');
      expect(mockFileStorageService.upload).toHaveBeenCalledWith(mockFile, 'user-uuid', 'cv-items');
    });

    it('rejects when enrollment is not draft', async () => {
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce({
        ...mockEnrollment,
        status: 'submitted',
      });

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when user is not the owner', async () => {
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce({
        ...mockEnrollment,
        candidateId: 'other-user-uuid',
      });

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when scoring category does not belong to the period', async () => {
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      mockCvItemRepository.findScoringCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        enrollmentPeriodId: 'other-period-uuid',
      });

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when scoring category level does not match enrollment', async () => {
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      mockCvItemRepository.findScoringCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        level: 'doctoral',
      });

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when scoring category is not found', async () => {
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      mockCvItemRepository.findScoringCategoryById.mockResolvedValueOnce(null);

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'nonexistent-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEnrollment', () => {
    it('returns items for an enrollment', async () => {
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([mockCvItem]);

      const result = await service.findByEnrollment('enrollment-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-uuid');
    });

    it('returns empty array when no items exist', async () => {
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([]);

      const result = await service.findByEnrollment('enrollment-uuid');

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns item when found', async () => {
      mockCvItemRepository.findById.mockResolvedValueOnce(mockCvItem);

      const result = await service.findById('enrollment-uuid', 'item-uuid');

      expect(result.id).toBe('item-uuid');
    });

    it('throws NotFoundException when item not found', async () => {
      mockCvItemRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById('enrollment-uuid', 'missing-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when item belongs to different enrollment', async () => {
      mockCvItemRepository.findById.mockResolvedValueOnce({
        ...mockCvItem,
        enrollmentId: 'other-enrollment-uuid',
      });

      await expect(service.findById('enrollment-uuid', 'item-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates a CV item', async () => {
      const updatedItem = { ...mockCvItem, description: 'Updated' };

      // getAndValidateEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // findById
      mockCvItemRepository.findById.mockResolvedValueOnce(mockCvItem);
      // update
      mockCvItemRepository.update.mockResolvedValueOnce(updatedItem);
      // recalculateScore → getEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // recalculateScore → findByEnrollment
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([updatedItem]);

      const result = await service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {
        description: 'Updated',
      });

      expect(result.description).toBe('Updated');
    });

    it('updates with file replaces old file', async () => {
      const itemWithFile = { ...mockCvItem, proofFileId: 'old-file-uuid' };
      const updatedItem = { ...itemWithFile, proofFileId: 'file-uuid' };

      // getAndValidateEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // findById
      mockCvItemRepository.findById.mockResolvedValueOnce(itemWithFile);
      // update
      mockCvItemRepository.update.mockResolvedValueOnce(updatedItem);
      // recalculateScore → getEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // recalculateScore → findByEnrollment
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([updatedItem]);

      await service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {}, mockFile);

      expect(mockFileStorageService.delete).toHaveBeenCalledWith('old-file-uuid');
      expect(mockFileStorageService.upload).toHaveBeenCalledWith(mockFile, 'user-uuid', 'cv-items');
    });

    it('validates new scoring category on update', async () => {
      // getAndValidateEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // findById
      mockCvItemRepository.findById.mockResolvedValueOnce(mockCvItem);
      // getEnrollment for category validation
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // validateScoringCategory — wrong period
      mockCvItemRepository.findScoringCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        enrollmentPeriodId: 'wrong-period',
      });

      await expect(
        service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {
          scoringCategoryId: 'other-category-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates score field (including null)', async () => {
      const updatedWithScore = { ...mockCvItem, score: 7.5 };
      const updatedWithNullScore = { ...mockCvItem, score: null };

      // Test with numeric score
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment); // getAndValidateEnrollment
      mockCvItemRepository.findById.mockResolvedValueOnce(mockCvItem); // findById
      mockCvItemRepository.update.mockResolvedValueOnce(updatedWithScore); // update
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment); // recalculateScore → getEnrollment
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([updatedWithScore]); // recalculateScore → findByEnrollment

      let result = await service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {
        score: 7.5,
      });

      expect(result.score).toBe(7.5);
      expect(mockCvItemRepository.update).toHaveBeenCalledWith(
        'item-uuid',
        expect.objectContaining({ score: 7.5 }),
      );

      // Reset mock call counts
      mockCvItemRepository.update.mockClear();

      // Test with null score
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      mockCvItemRepository.findById.mockResolvedValueOnce(mockCvItem);
      mockCvItemRepository.update.mockResolvedValueOnce(updatedWithNullScore);
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([updatedWithNullScore]);

      result = await service.update('user-uuid', 'enrollment-uuid', 'item-uuid', { score: null });

      expect(result.score).toBeNull();
      expect(mockCvItemRepository.update).toHaveBeenCalledWith(
        'item-uuid',
        expect.objectContaining({ score: null }),
      );
    });
  });

  describe('remove', () => {
    it('removes a CV item and cleans up file', async () => {
      const itemWithFile = { ...mockCvItem, proofFileId: 'file-uuid' };

      // getAndValidateEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // findById
      mockCvItemRepository.findById.mockResolvedValueOnce(itemWithFile);
      // recalculateScore → getEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // recalculateScore → findByEnrollment
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([]);

      await service.remove('user-uuid', 'enrollment-uuid', 'item-uuid');

      expect(mockFileStorageService.delete).toHaveBeenCalledWith('file-uuid');
      expect(mockCvItemRepository.remove).toHaveBeenCalledWith('item-uuid');
    });

    it('removes a CV item without file', async () => {
      // getAndValidateEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // findById
      mockCvItemRepository.findById.mockResolvedValueOnce(mockCvItem);
      // recalculateScore → getEnrollment
      mockCvItemRepository.findEnrollmentById.mockResolvedValueOnce(mockEnrollment);
      // recalculateScore → findByEnrollment
      mockCvItemRepository.findByEnrollment.mockResolvedValueOnce([]);

      await service.remove('user-uuid', 'enrollment-uuid', 'item-uuid');

      expect(mockFileStorageService.delete).not.toHaveBeenCalled();
      expect(mockCvItemRepository.remove).toHaveBeenCalledWith('item-uuid');
    });
  });

  describe('recalculateScore', () => {
    it('recalculates score after create', async () => {
      setupCreateMocks();

      await service.create('user-uuid', 'enrollment-uuid', {
        scoringCategoryId: 'category-uuid',
        description: 'Artigo publicado',
      });

      expect(mockCvScoringService.getCategoriesForPeriod).toHaveBeenCalledWith(
        'period-uuid',
        'masters',
      );
      expect(mockCvScoringService.calculateScoreFromItems).toHaveBeenCalled();
      // base (6) + earned (10) = 16.00
      expect(mockCvItemRepository.updateEnrollmentScore).toHaveBeenCalledWith(
        'enrollment-uuid',
        '16.00',
      );
    });
  });
});
