import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import { FileStorageService } from '../file-storage/file-storage.service';
import { RoleEnum } from '../roles/roles.enum';
import { UsersService } from '../users/users.service';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentService } from './enrollment.service';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let mockDb: any;
  let mockUsersService: any;
  let mockEnrollmentPeriodService: any;
  let mockFileStorageService: any;

  const mockUser = {
    id: 'user-uuid',
    role: RoleEnum.candidate,
    onboardingCompleted: true,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockPeriod = {
    id: 'period-uuid',
    name: 'Seleção 2026.1',
    semester: '2026.1',
    startDate: new Date('2026-01-15T00:00:00.000Z'),
    endDate: new Date('2026-02-15T23:59:59.000Z'),
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEnrollment = {
    id: 'enrollment-uuid',
    candidateId: 'user-uuid',
    enrollmentPeriodId: 'period-uuid',
    level: 'masters',
    status: 'draft',
    phone: null,
    justification: null,
    sigaaCode: null,
    sigaaReceiptFileId: null,
    declaration: false,
    poscomp: null,
    mastersDegrees: null,
    scoreDraft: null,
    submittedAt: null,
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
      offset: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockEnrollment]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockUsersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    mockEnrollmentPeriodService = {
      findById: jest.fn().mockResolvedValue(mockPeriod),
    };

    mockFileStorageService = {
      upload: jest.fn().mockResolvedValue({ id: 'file-uuid' }),
      delete: jest.fn().mockResolvedValue(undefined),
      getSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
    };

    const module = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        { provide: DRIZZLE_TX, useValue: mockDb },
        { provide: UsersService, useValue: mockUsersService },
        {
          provide: EnrollmentPeriodService,
          useValue: mockEnrollmentPeriodService,
        },
        {
          provide: FileStorageService,
          useValue: mockFileStorageService,
        },
        {
          provide: getLoggerToken(EnrollmentService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnrollmentService>(EnrollmentService);
  });

  describe('create', () => {
    it('creates enrollment for valid candidate', async () => {
      // No existing enrollment
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await service.create('user-uuid', {
        level: 'masters' as any,
        enrollmentPeriodId: 'period-uuid',
      });

      expect(result.id).toBe(mockEnrollment.id);
      expect(result.candidateId).toBe('user-uuid');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('rejects when period is not open', async () => {
      mockEnrollmentPeriodService.findById.mockResolvedValueOnce({
        ...mockPeriod,
        status: 'scheduled',
      });

      await expect(
        service.create('user-uuid', {
          level: 'masters' as any,
          enrollmentPeriodId: 'period-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when user is not a candidate', async () => {
      mockUsersService.findById.mockResolvedValueOnce({
        ...mockUser,
        role: RoleEnum.professor,
      });

      await expect(
        service.create('user-uuid', {
          level: 'masters' as any,
          enrollmentPeriodId: 'period-uuid',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when onboarding not completed', async () => {
      mockUsersService.findById.mockResolvedValueOnce({
        ...mockUser,
        onboardingCompleted: false,
      });

      await expect(
        service.create('user-uuid', {
          level: 'masters' as any,
          enrollmentPeriodId: 'period-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate enrollment for same period', async () => {
      // Existing enrollment found
      mockDb.limit.mockResolvedValueOnce([{ id: 'existing-uuid' }]);

      await expect(
        service.create('user-uuid', {
          level: 'masters' as any,
          enrollmentPeriodId: 'period-uuid',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('returns enrollment when found', async () => {
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);

      const result = await service.findById('enrollment-uuid');

      expect(result.id).toBe(mockEnrollment.id);
    });

    it('throws when enrollment not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates enrollment fields', async () => {
      // findById returns enrollment
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);

      const updatedEnrollment = {
        ...mockEnrollment,
        phone: '11999999999',
      };
      mockDb.returning.mockResolvedValueOnce([updatedEnrollment]);

      const result = await service.update('user-uuid', 'enrollment-uuid', {
        phone: '11999999999',
      });

      expect(result.phone).toBe('11999999999');
    });

    it('rejects update when enrollment is not draft', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, status: 'submitted' }]);

      await expect(
        service.update('user-uuid', 'enrollment-uuid', {
          phone: '11999999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects update when user does not own enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, candidateId: 'other-user-uuid' }]);

      await expect(
        service.update('user-uuid', 'enrollment-uuid', {
          phone: '11999999999',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects update when period is not open', async () => {
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);
      mockEnrollmentPeriodService.findById.mockResolvedValueOnce({
        ...mockPeriod,
        status: 'closed',
      });

      await expect(
        service.update('user-uuid', 'enrollment-uuid', {
          phone: '11999999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit', () => {
    it('submits enrollment', async () => {
      const readyEnrollment = {
        ...mockEnrollment,
        phone: '11999999999',
        justification: 'Minha justificativa',
      };
      mockDb.limit.mockResolvedValueOnce([readyEnrollment]);

      const submittedEnrollment = {
        ...readyEnrollment,
        status: 'submitted',
        submittedAt: new Date(),
      };
      mockDb.returning.mockResolvedValueOnce([submittedEnrollment]);

      const result = await service.submit('user-uuid', 'enrollment-uuid');

      expect(result.status).toBe('submitted');
      expect(result.submittedAt).toBeDefined();
    });

    it('rejects submission with missing phone', async () => {
      const incompleteEnrollment = {
        ...mockEnrollment,
        phone: null,
        justification: 'Some justification',
      };
      mockDb.limit.mockResolvedValueOnce([incompleteEnrollment]);

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects submission with missing justification', async () => {
      const incompleteEnrollment = {
        ...mockEnrollment,
        phone: '11999999999',
        justification: null,
      };
      mockDb.limit.mockResolvedValueOnce([incompleteEnrollment]);

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects submission when enrollment is not draft', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, status: 'submitted' }]);

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects submission when user does not own enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          ...mockEnrollment,
          candidateId: 'other-user-uuid',
          phone: '11999999999',
          justification: 'test',
        },
      ]);

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates enrollment status', async () => {
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);

      const closedEnrollment = { ...mockEnrollment, status: 'closed' };
      mockDb.returning.mockResolvedValueOnce([closedEnrollment]);

      const result = await service.updateStatus('enrollment-uuid', {
        status: 'closed' as any,
      });

      expect(result.status).toBe('closed');
    });
  });

  describe('findMine', () => {
    it('returns enrollments for user', async () => {
      mockDb.where.mockResolvedValueOnce([mockEnrollment]);

      const result = await service.findMine('user-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].candidateId).toBe('user-uuid');
    });
  });

  describe('updateMastersDegrees', () => {
    const doctoralEnrollment = {
      ...mockEnrollment,
      level: 'doctoral',
    };

    const validDto = {
      mastersDegrees: [
        {
          university: 'UFC',
          graduateProgram: 'Ciência da Computação',
          ira: 8.5,
          isPrimary: true,
        },
      ],
    };

    it('updates masters degrees for doctoral enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([doctoralEnrollment]);

      const updatedEnrollment = {
        ...doctoralEnrollment,
        mastersDegrees: validDto.mastersDegrees,
      };
      mockDb.returning.mockResolvedValueOnce([updatedEnrollment]);

      const result = await service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto);

      expect(result.mastersDegrees).toEqual(validDto.mastersDegrees);
    });

    it('rejects when enrollment is not doctoral', async () => {
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]); // level: 'masters'

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when user does not own enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([
        { ...doctoralEnrollment, candidateId: 'other-user-uuid' },
      ]);

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when enrollment is not draft', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...doctoralEnrollment, status: 'submitted' }]);

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when no entry is marked as primary', async () => {
      mockDb.limit.mockResolvedValueOnce([doctoralEnrollment]);

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', {
          mastersDegrees: [
            {
              university: 'UFC',
              graduateProgram: 'CC',
              ira: 8.5,
              isPrimary: false,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when multiple entries are marked as primary', async () => {
      mockDb.limit.mockResolvedValueOnce([doctoralEnrollment]);

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', {
          mastersDegrees: [
            {
              university: 'UFC',
              graduateProgram: 'CC',
              ira: 8.5,
              isPrimary: true,
            },
            {
              university: 'UFCG',
              graduateProgram: 'CC',
              ira: 9.0,
              isPrimary: true,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('successfully cancels a draft enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([mockEnrollment]);

      await service.cancel('user-uuid', 'enrollment-uuid');

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('rejects cancellation of non-draft enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, status: 'submitted' }]);

      await expect(service.cancel('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cancellation when user does not own enrollment', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockEnrollment, candidateId: 'other-user-uuid' }]);

      await expect(service.cancel('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
