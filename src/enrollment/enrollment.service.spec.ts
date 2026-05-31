import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { FileStorageService } from '../file-storage/file-storage.service';
import { RoleEnum } from '../roles/roles.enum';
import { UsersService } from '../users/users.service';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentRepository } from './infrastructure/persistence/enrollment.repository';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let mockRepository: any;
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
    mockRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findByCandidateId: jest.fn().mockResolvedValue([]),
      findByCandidateAndPeriod: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
      create: jest.fn().mockResolvedValue(mockEnrollment),
      update: jest.fn().mockResolvedValue(mockEnrollment),
      remove: jest.fn().mockResolvedValue(undefined),
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
        { provide: EnrollmentRepository, useValue: mockRepository },
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
      mockRepository.findByCandidateAndPeriod.mockResolvedValueOnce(null);

      const result = await service.create('user-uuid', {
        level: 'masters' as any,
        enrollmentPeriodId: 'period-uuid',
      });

      expect(result.id).toBe(mockEnrollment.id);
      expect(result.candidateId).toBe('user-uuid');
      expect(mockRepository.create).toHaveBeenCalled();
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
      mockRepository.findByCandidateAndPeriod.mockResolvedValueOnce(mockEnrollment);

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
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);

      const result = await service.findById('enrollment-uuid');

      expect(result.id).toBe(mockEnrollment.id);
    });

    it('throws when enrollment not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates enrollment fields', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);

      const updatedEnrollment = {
        ...mockEnrollment,
        phone: '11999999999',
      };
      mockRepository.update.mockResolvedValueOnce(updatedEnrollment);

      const result = await service.update('user-uuid', 'enrollment-uuid', {
        phone: '11999999999',
      });

      expect(result.phone).toBe('11999999999');
    });

    it('rejects update when enrollment is not draft', async () => {
      mockRepository.findById.mockResolvedValueOnce({ ...mockEnrollment, status: 'submitted' });

      await expect(
        service.update('user-uuid', 'enrollment-uuid', {
          phone: '11999999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects update when user does not own enrollment', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...mockEnrollment,
        candidateId: 'other-user-uuid',
      });

      await expect(
        service.update('user-uuid', 'enrollment-uuid', {
          phone: '11999999999',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects update when period is not open', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);
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
      mockRepository.findById.mockResolvedValueOnce(readyEnrollment);

      const submittedEnrollment = {
        ...readyEnrollment,
        status: 'submitted',
        submittedAt: new Date(),
      };
      mockRepository.update.mockResolvedValueOnce(submittedEnrollment);

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
      mockRepository.findById.mockResolvedValueOnce(incompleteEnrollment);

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
      mockRepository.findById.mockResolvedValueOnce(incompleteEnrollment);

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects submission when enrollment is not draft', async () => {
      mockRepository.findById.mockResolvedValueOnce({ ...mockEnrollment, status: 'submitted' });

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects submission when user does not own enrollment', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...mockEnrollment,
        candidateId: 'other-user-uuid',
        phone: '11999999999',
        justification: 'test',
      });

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates enrollment status', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);

      const closedEnrollment = { ...mockEnrollment, status: 'closed' };
      mockRepository.update.mockResolvedValueOnce(closedEnrollment);

      const result = await service.updateStatus('enrollment-uuid', {
        status: 'closed' as any,
      });

      expect(result.status).toBe('closed');
    });
  });

  describe('findMine', () => {
    it('returns enrollments for user', async () => {
      mockRepository.findByCandidateId.mockResolvedValueOnce([mockEnrollment]);

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
      mockRepository.findById.mockResolvedValueOnce(doctoralEnrollment);

      const updatedEnrollment = {
        ...doctoralEnrollment,
        mastersDegrees: validDto.mastersDegrees,
      };
      mockRepository.update.mockResolvedValueOnce(updatedEnrollment);

      const result = await service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto);

      expect(result.mastersDegrees).toEqual(validDto.mastersDegrees);
    });

    it('rejects when enrollment is not doctoral', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment); // level: 'masters'

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when user does not own enrollment', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...doctoralEnrollment,
        candidateId: 'other-user-uuid',
      });

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when enrollment is not draft', async () => {
      mockRepository.findById.mockResolvedValueOnce({ ...doctoralEnrollment, status: 'submitted' });

      await expect(
        service.updateMastersDegrees('user-uuid', 'enrollment-uuid', validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when no entry is marked as primary', async () => {
      mockRepository.findById.mockResolvedValueOnce(doctoralEnrollment);

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
      mockRepository.findById.mockResolvedValueOnce(doctoralEnrollment);

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
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);

      await service.cancel('user-uuid', 'enrollment-uuid');

      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it('rejects cancellation of non-draft enrollment', async () => {
      mockRepository.findById.mockResolvedValueOnce({ ...mockEnrollment, status: 'submitted' });

      await expect(service.cancel('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cancellation when user does not own enrollment', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...mockEnrollment,
        candidateId: 'other-user-uuid',
      });

      await expect(service.cancel('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
