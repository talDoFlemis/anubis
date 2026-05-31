import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import { FileStorageService } from '../file-storage/file-storage.service';
import { CvItemService } from './cv-item.service';
import { CvScoringService } from './cv-scoring.service';

/**
 * Creates a chainable mock DB that supports both select and mutation chains.
 *
 * Terminal methods:
 *   - `limit()` for select chains
 *   - `returning()` for insert/update chains
 *   - the `where()` on `delete` chains resolves directly
 *
 * We track calls via queued return values on terminal methods.
 */
function createMockDb() {
  const db: any = {};

  // terminal methods — push values with mockResolvedValueOnce
  db.limit = jest.fn().mockResolvedValue([]);
  db.returning = jest.fn().mockResolvedValue([]);
  db.orderBy = jest.fn().mockResolvedValue([]);

  // chainable methods — always return db so the chain continues
  db.select = jest.fn().mockReturnValue(db);
  db.from = jest.fn().mockReturnValue(db);
  db.leftJoin = jest.fn().mockReturnValue(db);
  db.where = jest.fn().mockReturnValue(db);
  db.insert = jest.fn().mockReturnValue(db);
  db.values = jest.fn().mockReturnValue(db);
  db.update = jest.fn().mockReturnValue(db);
  db.set = jest.fn().mockReturnValue(db);
  db.delete = jest.fn().mockReturnValue(db);

  return db;
}

describe('CvItemService', () => {
  let service: CvItemService;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockCvScoringService: any;
  let mockFileStorageService: any;

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
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    mockDb = createMockDb();

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
        { provide: DRIZZLE_TX, useValue: mockDb },
        { provide: CvScoringService, useValue: mockCvScoringService },
        { provide: FileStorageService, useValue: mockFileStorageService },
      ],
    }).compile();

    service = module.get<CvItemService>(CvItemService);
  });

  /**
   * Helper to set up mocks for a successful create flow:
   *   1. getAndValidateEnrollment → getEnrollment (limit)
   *   2. validateScoringCategory (limit)
   *   3. insert → returning
   *   4. recalculateScore → getEnrollment (limit)
   *   5. recalculateScore → findByEnrollment (orderBy)
   *   6. recalculateScore → update enrollment (returning — ignored)
   */
  function setupCreateMocks(overrides: { enrollment?: any; category?: any; item?: any } = {}) {
    const enrollment = overrides.enrollment ?? mockEnrollment;
    const category = overrides.category ?? mockCategory;
    const item = overrides.item ?? mockCvItem;

    mockDb.limit
      .mockResolvedValueOnce([enrollment]) // getAndValidateEnrollment
      .mockResolvedValueOnce([category]); // validateScoringCategory

    mockDb.returning.mockResolvedValueOnce([item]); // insert

    // recalculateScore
    mockDb.limit.mockResolvedValueOnce([enrollment]); // getEnrollment
    mockDb.orderBy.mockResolvedValueOnce([{ cvItem: item, proofFileName: null }]); // findByEnrollment
    // update enrollment (set().where() — where returns db, no terminal needed)
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
      expect(mockDb.insert).toHaveBeenCalled();
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
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, status: 'submitted' }]);

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when user is not the owner', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, candidateId: 'other-user-uuid' }]);

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when scoring category does not belong to the period', async () => {
      mockDb.limit
        .mockResolvedValueOnce([mockEnrollment])
        .mockResolvedValueOnce([{ ...mockCategory, enrollmentPeriodId: 'other-period-uuid' }]);

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when scoring category level does not match enrollment', async () => {
      mockDb.limit
        .mockResolvedValueOnce([mockEnrollment])
        .mockResolvedValueOnce([{ ...mockCategory, level: 'doctoral' }]);

      await expect(
        service.create('user-uuid', 'enrollment-uuid', {
          scoringCategoryId: 'category-uuid',
          description: 'Artigo publicado',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when scoring category is not found', async () => {
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]).mockResolvedValueOnce([]);

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
      mockDb.orderBy.mockResolvedValueOnce([{ cvItem: mockCvItem, proofFileName: null }]);

      const result = await service.findByEnrollment('enrollment-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-uuid');
    });

    it('returns empty array when no items exist', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await service.findByEnrollment('enrollment-uuid');

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns item when found', async () => {
      mockDb.limit.mockResolvedValueOnce([mockCvItem]);

      const result = await service.findById('enrollment-uuid', 'item-uuid');

      expect(result.id).toBe('item-uuid');
    });

    it('throws NotFoundException when item not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.findById('enrollment-uuid', 'missing-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when item belongs to different enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([
        { ...mockCvItem, enrollmentId: 'other-enrollment-uuid' },
      ]);

      await expect(service.findById('enrollment-uuid', 'item-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates a CV item', async () => {
      const updatedItem = { ...mockCvItem, description: 'Updated' };

      // getAndValidateEnrollment → getEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // findById
      mockDb.limit.mockResolvedValueOnce([mockCvItem]);
      // update returning
      mockDb.returning.mockResolvedValueOnce([updatedItem]);
      // recalculateScore → getEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // recalculateScore → findByEnrollment
      mockDb.orderBy.mockResolvedValueOnce([{ cvItem: updatedItem, proofFileName: null }]);

      const result = await service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {
        description: 'Updated',
      });

      expect(result.description).toBe('Updated');
    });

    it('updates with file replaces old file', async () => {
      const itemWithFile = { ...mockCvItem, proofFileId: 'old-file-uuid' };
      const updatedItem = { ...itemWithFile, proofFileId: 'file-uuid' };

      // getAndValidateEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // findById
      mockDb.limit.mockResolvedValueOnce([itemWithFile]);
      // update returning
      mockDb.returning.mockResolvedValueOnce([updatedItem]);
      // recalculateScore → getEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // recalculateScore → findByEnrollment
      mockDb.orderBy.mockResolvedValueOnce([{ cvItem: updatedItem, proofFileName: null }]);

      await service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {}, mockFile);

      expect(mockFileStorageService.delete).toHaveBeenCalledWith('old-file-uuid');
      expect(mockFileStorageService.upload).toHaveBeenCalledWith(mockFile, 'user-uuid', 'cv-items');
    });

    it('validates new scoring category on update', async () => {
      // getAndValidateEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // findById
      mockDb.limit.mockResolvedValueOnce([mockCvItem]);
      // getEnrollment for category validation
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // validateScoringCategory — wrong period
      mockDb.limit.mockResolvedValueOnce([{ ...mockCategory, enrollmentPeriodId: 'wrong-period' }]);

      await expect(
        service.update('user-uuid', 'enrollment-uuid', 'item-uuid', {
          scoringCategoryId: 'other-category-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('removes a CV item and cleans up file', async () => {
      const itemWithFile = { ...mockCvItem, proofFileId: 'file-uuid' };

      // getAndValidateEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // findById
      mockDb.limit.mockResolvedValueOnce([itemWithFile]);
      // recalculateScore → getEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // recalculateScore → findByEnrollment
      mockDb.orderBy.mockResolvedValueOnce([]);

      await service.remove('user-uuid', 'enrollment-uuid', 'item-uuid');

      expect(mockFileStorageService.delete).toHaveBeenCalledWith('file-uuid');
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('removes a CV item without file', async () => {
      // getAndValidateEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // findById
      mockDb.limit.mockResolvedValueOnce([mockCvItem]);
      // recalculateScore → getEnrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      // recalculateScore → findByEnrollment
      mockDb.orderBy.mockResolvedValueOnce([]);

      await service.remove('user-uuid', 'enrollment-uuid', 'item-uuid');

      expect(mockFileStorageService.delete).not.toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
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
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
