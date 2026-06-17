import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { FileStorageService } from '../file-storage/file-storage.service';
import { MailService } from '../mail/mail.service';
import { ResearchThemeService } from '../research-theme/research-theme.service';
import { RoleEnum } from '../roles/roles.enum';
import { UsersService } from '../users/users.service';
import { EnrollmentLevel } from './dto/enrollment-level.enum';
import { EnrollmentStatusUpdate } from './dto/update-enrollment-status.dto';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentRepository } from './infrastructure/persistence/enrollment.repository';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUsersService: Record<string, jest.Mock>;
  let mockEnrollmentPeriodService: Record<string, jest.Mock>;
  let mockFileStorageService: Record<string, jest.Mock>;
  let mockResearchThemeService: Record<string, jest.Mock>;
  let mockMailService: Record<string, jest.Mock>;

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
    primaryThemeId: null,
    secondaryThemeId: null,
    poscomp: null,
    mastersDegrees: null,
    projectTitle: null,
    projectFileId: null,
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
      findCvItemFileIds: jest.fn().mockResolvedValue([]),
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
      findById: jest.fn().mockResolvedValue({ id: 'file-uuid', originalName: 'projeto.pdf' }),
    };

    mockResearchThemeService = {
      findById: jest.fn().mockResolvedValue({
        id: 'theme-uuid',
        level: 'masters',
        title: 'Tema de Teste',
      }),
    };

    mockMailService = {
      send: jest.fn().mockResolvedValue(undefined),
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
          provide: ResearchThemeService,
          useValue: mockResearchThemeService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
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
        level: EnrollmentLevel.Masters,
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
          level: EnrollmentLevel.Masters,
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
          level: EnrollmentLevel.Masters,
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
          level: EnrollmentLevel.Masters,
          enrollmentPeriodId: 'period-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate enrollment for same period', async () => {
      mockRepository.findByCandidateAndPeriod.mockResolvedValueOnce(mockEnrollment);

      await expect(
        service.create('user-uuid', {
          level: EnrollmentLevel.Masters,
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
        undergradUniversity: 'UFRN',
        undergradCourse: 'Ciência da Computação',
        undergradDegreeType: 'bacharelado',
        ira: '8.50',
        phone: '11999999999',
        justification: 'Minha justificativa',
        declaration: true,
        sigaaCode: 'sigaa-code',
        sigaaReceiptFileId: 'file-uuid',
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
      };
      mockRepository.findById.mockResolvedValueOnce(readyEnrollment);

      const submittedEnrollment = {
        ...readyEnrollment,
        status: 'submitted',
        submittedAt: new Date(),
      };
      mockRepository.update.mockResolvedValueOnce(submittedEnrollment);
      mockResearchThemeService.findById
        .mockResolvedValueOnce({ id: 'theme-uuid-1', level: 'masters', title: 'Theme 1' })
        .mockResolvedValueOnce({ id: 'theme-uuid-2', level: 'masters', title: 'Theme 2' });

      const result = await service.submit('user-uuid', 'enrollment-uuid');

      expect(result.status).toBe('submitted');
      expect(result.submittedAt).toBeDefined();
    });

    it('triggers confirmation email on successful submission', async () => {
      const readyEnrollment = {
        ...mockEnrollment,
        undergradUniversity: 'UFRN',
        undergradCourse: 'Ciência da Computação',
        undergradDegreeType: 'bacharelado',
        ira: '8.50',
        phone: '11999999999',
        justification: 'Minha justificativa',
        declaration: true,
        sigaaCode: 'sigaa-code',
        sigaaReceiptFileId: 'file-uuid',
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
      };
      mockRepository.findById.mockResolvedValueOnce(readyEnrollment);

      const submittedEnrollment = {
        ...readyEnrollment,
        status: 'submitted',
        submittedAt: new Date(),
      };
      mockRepository.update.mockResolvedValueOnce(submittedEnrollment);
      mockResearchThemeService.findById
        .mockResolvedValueOnce({ id: 'theme-uuid-1', level: 'masters', title: 'Theme 1' })
        .mockResolvedValueOnce({ id: 'theme-uuid-2', level: 'masters', title: 'Theme 2' });

      await service.submit('user-uuid', 'enrollment-uuid');

      expect(mockMailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          title: 'Inscrição Submetida com Sucesso - MDCC',
        }),
      );
    });

    it('rejects submission with missing phone', async () => {
      const incompleteEnrollment = {
        ...mockEnrollment,
        phone: null,
        justification: 'Some justification',
        declaration: true,
        sigaaCode: 'sigaa-code',
        sigaaReceiptFileId: 'file-uuid',
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
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
        declaration: true,
        sigaaCode: 'sigaa-code',
        sigaaReceiptFileId: 'file-uuid',
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
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
        declaration: true,
        sigaaCode: 'sigaa-code',
        sigaaReceiptFileId: 'file-uuid',
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
      });

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    const doctoralBase = {
      ...mockEnrollment,
      level: 'doctoral',
      undergradUniversity: 'UFRN',
      undergradCourse: 'Ciência da Computação',
      undergradDegreeType: 'bacharelado',
      ira: '8.50',
      phone: '11999999999',
      justification: 'Minha justificativa',
      declaration: true,
      sigaaCode: 'sigaa-code',
      sigaaReceiptFileId: 'file-uuid',
      primaryThemeId: 'theme-uuid-1',
      mastersDegrees: [{ university: 'UFC', graduateProgram: 'CC', ira: 8.5, isPrimary: true }],
    };

    it('rejects doctoral submission without project title and file', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...doctoralBase,
        projectTitle: null,
        projectFileId: null,
      });

      await expect(service.submit('user-uuid', 'enrollment-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('submits doctoral enrollment with project and no secondary theme', async () => {
      const ready = {
        ...doctoralBase,
        projectTitle: 'Meu projeto de doutorado',
        projectFileId: 'project-file-uuid',
      };
      mockRepository.findById.mockResolvedValueOnce(ready);
      mockRepository.update.mockResolvedValueOnce({
        ...ready,
        status: 'submitted',
        submittedAt: new Date(),
      });
      mockResearchThemeService.findById.mockResolvedValueOnce({
        id: 'theme-uuid-1',
        level: 'doctoral',
        title: 'Theme 1',
      });

      const result = await service.submit('user-uuid', 'enrollment-uuid');

      expect(result.status).toBe('submitted');
    });
  });

  describe('updateThemes', () => {
    it('updates primary and secondary themes', async () => {
      const draftEnrollment = {
        ...mockEnrollment,
        status: 'draft',
        level: 'masters',
      };
      mockRepository.findById.mockResolvedValueOnce(draftEnrollment);
      mockResearchThemeService.findById
        .mockResolvedValueOnce({ id: 'theme-uuid-1', level: 'masters', title: 'Theme 1' })
        .mockResolvedValueOnce({ id: 'theme-uuid-2', level: 'masters', title: 'Theme 2' });

      const updatedEnrollment = {
        ...draftEnrollment,
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
      };
      mockRepository.update.mockResolvedValueOnce(updatedEnrollment);

      const result = await service.updateThemes('user-uuid', 'enrollment-uuid', {
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: 'theme-uuid-2',
      });

      expect(result.primaryThemeId).toBe('theme-uuid-1');
      expect(result.secondaryThemeId).toBe('theme-uuid-2');
    });

    it('allows omitting the secondary theme (Não desejo informar)', async () => {
      const draftEnrollment = {
        ...mockEnrollment,
        status: 'draft',
        level: 'masters',
      };
      mockRepository.findById.mockResolvedValueOnce(draftEnrollment);
      mockResearchThemeService.findById.mockResolvedValueOnce({
        id: 'theme-uuid-1',
        level: 'masters',
        title: 'Theme 1',
      });

      const updatedEnrollment = {
        ...draftEnrollment,
        primaryThemeId: 'theme-uuid-1',
        secondaryThemeId: null,
      };
      mockRepository.update.mockResolvedValueOnce(updatedEnrollment);

      const result = await service.updateThemes('user-uuid', 'enrollment-uuid', {
        primaryThemeId: 'theme-uuid-1',
      });

      expect(result.primaryThemeId).toBe('theme-uuid-1');
      expect(result.secondaryThemeId).toBeNull();
      expect(mockResearchThemeService.findById).toHaveBeenCalledTimes(1);
    });

    it('rejects duplicate primary and secondary themes', async () => {
      const draftEnrollment = {
        ...mockEnrollment,
        status: 'draft',
        level: 'masters',
      };
      mockRepository.findById.mockResolvedValueOnce(draftEnrollment);

      await expect(
        service.updateThemes('user-uuid', 'enrollment-uuid', {
          primaryThemeId: 'theme-uuid-1',
          secondaryThemeId: 'theme-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects incompatible theme levels', async () => {
      const draftEnrollment = {
        ...mockEnrollment,
        status: 'draft',
        level: 'masters',
      };
      mockRepository.findById.mockResolvedValueOnce(draftEnrollment);
      mockResearchThemeService.findById
        .mockResolvedValueOnce({ id: 'theme-uuid-1', level: 'doctoral', title: 'Theme 1' })
        .mockResolvedValueOnce({ id: 'theme-uuid-2', level: 'masters', title: 'Theme 2' });

      await expect(
        service.updateThemes('user-uuid', 'enrollment-uuid', {
          primaryThemeId: 'theme-uuid-1',
          secondaryThemeId: 'theme-uuid-2',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('updates enrollment status', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);

      const closedEnrollment = { ...mockEnrollment, status: 'closed' };
      mockRepository.update.mockResolvedValueOnce(closedEnrollment);

      const result = await service.updateStatus('enrollment-uuid', {
        status: EnrollmentStatusUpdate.Closed,
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

  describe('uploadProjectFile', () => {
    const doctoralDraft = { ...mockEnrollment, level: 'doctoral', status: 'draft' };

    it('uploads project file for doctoral draft', async () => {
      mockRepository.findById.mockResolvedValueOnce(doctoralDraft);
      mockRepository.update.mockResolvedValueOnce({ ...doctoralDraft, projectFileId: 'file-uuid' });

      const result = await service.uploadProjectFile('user-uuid', 'enrollment-uuid', {
        originalname: 'projeto.pdf',
      } as Express.Multer.File);

      expect(mockFileStorageService.upload).toHaveBeenCalled();
      expect(result.projectFileId).toBe('file-uuid');
    });

    it('rejects when enrollment is not doctoral', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment); // masters

      await expect(
        service.uploadProjectFile('user-uuid', 'enrollment-uuid', {} as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('replaces the previous project file', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...doctoralDraft,
        projectFileId: 'old-file',
      });
      mockRepository.update.mockResolvedValueOnce({ ...doctoralDraft, projectFileId: 'file-uuid' });

      await service.uploadProjectFile('user-uuid', 'enrollment-uuid', {} as Express.Multer.File);

      expect(mockFileStorageService.delete).toHaveBeenCalledWith('old-file');
    });
  });

  describe('cancel', () => {
    it('successfully cancels a draft enrollment', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockEnrollment);

      await service.cancel('user-uuid', 'enrollment-uuid');

      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it('deletes related files from storage when cancelling', async () => {
      const enrollmentWithFiles = {
        ...mockEnrollment,
        sigaaReceiptFileId: 'sigaa-file-uuid',
        poscomp: {
          hasPoscomp: true,
          receiptFileId: 'poscomp-file-uuid',
        },
      };
      mockRepository.findById.mockResolvedValueOnce(enrollmentWithFiles);
      mockRepository.findCvItemFileIds.mockResolvedValueOnce(['cv-file-uuid-1', 'cv-file-uuid-2']);

      await service.cancel('user-uuid', 'enrollment-uuid');

      expect(mockFileStorageService.delete).toHaveBeenCalledWith('sigaa-file-uuid');
      expect(mockFileStorageService.delete).toHaveBeenCalledWith('poscomp-file-uuid');
      expect(mockFileStorageService.delete).toHaveBeenCalledWith('cv-file-uuid-1');
      expect(mockFileStorageService.delete).toHaveBeenCalledWith('cv-file-uuid-2');
      expect(mockRepository.remove).toHaveBeenCalledWith('enrollment-uuid');
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
