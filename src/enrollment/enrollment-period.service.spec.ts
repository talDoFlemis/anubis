import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import { EnrollmentPeriodService } from './enrollment-period.service';

describe('EnrollmentPeriodService', () => {
  let service: EnrollmentPeriodService;
  let mockDb: any;

  const mockPeriod = {
    id: 'period-uuid',
    name: 'Seleção 2026.1',
    semester: '2026.1',
    startDate: new Date('2026-01-15T00:00:00.000Z'),
    endDate: new Date('2026-02-15T23:59:59.000Z'),
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockPeriod]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module = await Test.createTestingModule({
      providers: [
        EnrollmentPeriodService,
        { provide: DRIZZLE_TX, useValue: mockDb },
        {
          provide: getLoggerToken(EnrollmentPeriodService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnrollmentPeriodService>(EnrollmentPeriodService);
  });

  describe('create', () => {
    it('creates a period successfully', async () => {
      const dto = {
        name: 'Seleção 2026.1',
        semester: '2026.1',
        startDate: '2026-01-15T00:00:00.000Z',
        endDate: '2026-02-15T23:59:59.000Z',
      };

      // No overlapping periods found
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await service.create(dto);

      expect(result.id).toBe(mockPeriod.id);
      expect(result.name).toBe(mockPeriod.name);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('rejects when startDate >= endDate', async () => {
      const dto = {
        name: 'Test Period',
        semester: '2026.1',
        startDate: '2026-02-15T23:59:59.000Z',
        endDate: '2026-01-15T00:00:00.000Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects when overlapping period exists', async () => {
      const dto = {
        name: 'Overlapping Period',
        semester: '2026.1',
        startDate: '2026-01-15T00:00:00.000Z',
        endDate: '2026-02-15T23:59:59.000Z',
      };

      // Overlapping period found
      mockDb.limit.mockResolvedValueOnce([
        {
          id: 'existing-uuid',
          name: 'Seleção 2026.1',
          startDate: new Date('2026-01-15T00:00:00.000Z'),
          endDate: new Date('2026-02-15T23:59:59.000Z'),
        },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('finds period by id', async () => {
      mockDb.limit.mockResolvedValueOnce([mockPeriod]);

      const result = await service.findById('period-uuid');

      expect(result.id).toBe(mockPeriod.id);
      expect(result.name).toBe(mockPeriod.name);
    });

    it('throws when period not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    it('manual close works', async () => {
      // findById will return the period
      mockDb.limit.mockResolvedValueOnce([mockPeriod]);

      const closedPeriod = { ...mockPeriod, status: 'closed' };
      mockDb.returning.mockResolvedValueOnce([closedPeriod]);

      const result = await service.close('period-uuid');

      expect(result.status).toBe('closed');
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes period with no enrollments', async () => {
      // findById returns period
      mockDb.limit
        .mockResolvedValueOnce([mockPeriod])
        // no enrollments found
        .mockResolvedValueOnce([]);

      await expect(service.remove('period-uuid')).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('rejects deletion when enrollments exist', async () => {
      // findById returns period
      mockDb.limit
        .mockResolvedValueOnce([mockPeriod])
        // enrollments found
        .mockResolvedValueOnce([{ id: 'enrollment-uuid' }]);

      await expect(service.remove('period-uuid')).rejects.toThrow(ConflictException);
    });
  });

  describe('syncStatuses', () => {
    it('opens scheduled periods whose start date has passed', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'opened-uuid' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await expect(service.syncStatuses()).resolves.toBeUndefined();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('closes expired open periods', async () => {
      mockDb.returning
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'closed-uuid' }])
        .mockResolvedValueOnce([]);

      await expect(service.syncStatuses()).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates a period successfully', async () => {
      // findById returns the period
      mockDb.limit.mockResolvedValueOnce([mockPeriod]);

      const updatedPeriod = { ...mockPeriod, name: 'Updated Name' };
      mockDb.returning.mockResolvedValueOnce([updatedPeriod]);

      const result = await service.update('period-uuid', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('rejects update when dates are invalid', async () => {
      // findById returns the period
      mockDb.limit.mockResolvedValueOnce([mockPeriod]);

      await expect(
        service.update('period-uuid', {
          startDate: '2026-03-15T00:00:00.000Z',
          endDate: '2026-01-15T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns all periods ordered by startDate desc', async () => {
      mockDb.orderBy.mockResolvedValueOnce([mockPeriod]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockPeriod.id);
    });

    it('returns periods ordered by createdAt descending', async () => {
      mockDb.orderBy.mockResolvedValueOnce([mockPeriod]);

      await service.findAll();

      expect(mockDb.orderBy).toHaveBeenCalled();
      const orderByArg = mockDb.orderBy.mock.calls[0][0];
      expect(orderByArg).toBeDefined();
    });
  });

  describe('findCurrentOpen', () => {
    it('returns open periods', async () => {
      const openPeriod = { ...mockPeriod, status: 'open' };
      mockDb.orderBy.mockResolvedValueOnce([openPeriod]);

      const result = await service.findCurrentOpen();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('open');
    });
  });
});
