import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentPeriodRepository } from './infrastructure/persistence/enrollment-period.repository';

describe('EnrollmentPeriodService', () => {
  let service: EnrollmentPeriodService;
  let mockRepository: Record<string, jest.Mock>;

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
    mockRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findByStatus: jest.fn().mockResolvedValue([]),
      findOverlapping: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(mockPeriod),
      update: jest.fn().mockResolvedValue(mockPeriod),
      remove: jest.fn().mockResolvedValue(undefined),
      hasEnrollments: jest.fn().mockResolvedValue(false),
      syncStatuses: jest.fn().mockResolvedValue({ opened: [], closed: [], skipped: [] }),
    };

    const module = await Test.createTestingModule({
      providers: [
        EnrollmentPeriodService,
        { provide: EnrollmentPeriodRepository, useValue: mockRepository },
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

      const result = await service.create(dto);

      expect(result.id).toBe(mockPeriod.id);
      expect(result.name).toBe(mockPeriod.name);
      expect(mockRepository.create).toHaveBeenCalled();
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

      mockRepository.findOverlapping.mockResolvedValueOnce([
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
      mockRepository.findById.mockResolvedValueOnce(mockPeriod);

      const result = await service.findById('period-uuid');

      expect(result.id).toBe(mockPeriod.id);
      expect(result.name).toBe(mockPeriod.name);
    });

    it('throws when period not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    it('manual close works', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockPeriod);

      const closedPeriod = { ...mockPeriod, status: 'closed' };
      mockRepository.update.mockResolvedValueOnce(closedPeriod);

      const result = await service.close('period-uuid');

      expect(result.status).toBe('closed');
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes period with no enrollments', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockPeriod);
      mockRepository.hasEnrollments.mockResolvedValueOnce(false);

      await expect(service.remove('period-uuid')).resolves.toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it('rejects deletion when enrollments exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockPeriod);
      mockRepository.hasEnrollments.mockResolvedValueOnce(true);

      await expect(service.remove('period-uuid')).rejects.toThrow(ConflictException);
    });
  });

  describe('syncStatuses', () => {
    it('opens scheduled periods whose start date has passed', async () => {
      mockRepository.syncStatuses.mockResolvedValueOnce({
        opened: [{ id: 'opened-uuid' }],
        closed: [],
        skipped: [],
      });

      await expect(service.syncStatuses()).resolves.toBeUndefined();
      expect(mockRepository.syncStatuses).toHaveBeenCalled();
    });

    it('closes expired open periods', async () => {
      mockRepository.syncStatuses.mockResolvedValueOnce({
        opened: [],
        closed: [{ id: 'closed-uuid' }],
        skipped: [],
      });

      await expect(service.syncStatuses()).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates a period successfully', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockPeriod);

      const updatedPeriod = { ...mockPeriod, name: 'Updated Name' };
      mockRepository.update.mockResolvedValueOnce(updatedPeriod);

      const result = await service.update('period-uuid', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('rejects update when dates are invalid', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockPeriod);

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
      mockRepository.findAll.mockResolvedValueOnce([mockPeriod]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockPeriod.id);
    });

    it('returns periods ordered by createdAt descending', async () => {
      mockRepository.findAll.mockResolvedValueOnce([mockPeriod]);

      await service.findAll();

      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findCurrentOpen', () => {
    it('returns open periods', async () => {
      const openPeriod = { ...mockPeriod, status: 'open' };
      mockRepository.findByStatus.mockResolvedValueOnce([openPeriod]);

      const result = await service.findCurrentOpen();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('open');
    });
  });
});
