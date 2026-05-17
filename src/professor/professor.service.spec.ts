import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { InvitationService } from '../invitation/invitation.service';
import { RoleEnum } from '../roles/roles.enum';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';
import type { Professor } from './domain/professor';
import { ProfessorRepository } from './infraestructure/persistence/professor.repository';
import { ProfessorService } from './professor.service';

describe('ProfessorService', () => {
  let service: ProfessorService;
  let usersService: jest.Mocked<UsersService>;
  let professorRepository: jest.Mocked<ProfessorRepository>;
  let invitationService: jest.Mocked<InvitationService>;
  let deleteByUserIdMock: jest.Mock;
  let professorUpdateMock: jest.Mock;

  const professor: Professor = {
    id: 'user-1',
    authProvider: AuthProvidersEnum.email,
    providerSubject: 'prof@ufc.br',
    email: 'prof@ufc.br',
    password: null,
    cpf: '12345678901',
    firstName: 'Maria',
    lastName: 'Silva',
    role: RoleEnum.professor,
    status: StatusEnum.active,
    onboardingCompleted: true,
    mustChangePassword: true,
    bootstrapPasswordExpiresAt: null,
    confirmEmailTokenVersion: 0,
    forgotPasswordTokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
    department: 'Departamento de Computacao',
    institution: 'UFC',
  };

  beforeEach(async () => {
    deleteByUserIdMock = jest.fn();
    professorUpdateMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByCpf: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            deleteByUserId: deleteByUserIdMock,
          },
        },
        {
          provide: ProfessorRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAllByFilters: jest.fn(),
            update: professorUpdateMock,
            remove: jest.fn(),
          },
        },
        {
          provide: InvitationService,
          useValue: {
            sendInvitation: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(ProfessorService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProfessorService);
    usersService = module.get(UsersService);
    professorRepository = module.get(ProfessorRepository);
    invitationService = module.get(InvitationService);
  });

  it('invites professor when unique constraints pass', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    professorRepository.create.mockResolvedValue(professor);

    await expect(
      service.invite({
        email: 'prof@ufc.br',
        department: 'Departamento de Computacao',
        institution: 'UFC',
      } as never),
    ).resolves.toEqual(professor);

    expect(professorRepository.create.mock.calls).toEqual([
      [
        expect.objectContaining({
          authProvider: AuthProvidersEnum.email,
          providerSubject: 'prof@ufc.br',
          onboardingCompleted: true,
          mustChangePassword: true,
        }),
      ],
    ]);
    expect(invitationService.sendInvitation.mock.calls).toEqual([
      [
        {
          userId: 'user-1',
          email: 'prof@ufc.br',
          currentTokenVersion: 0,
          onboardingPath: '/auth/onboarding/professor',
        },
      ],
    ]);
  });

  it('rejects duplicate email on create', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'other' } as never);

    await expect(
      service.invite({
        email: 'prof@ufc.br',
        department: 'Departamento de Computacao',
        institution: 'UFC',
      } as never),
    ).rejects.toThrow(ConflictException);
  });

  it('normalizes email on create', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    professorRepository.create.mockResolvedValue(professor);

    await expect(
      service.invite({
        email: '  Prof@Ufc.br ',
        department: 'Departamento de Computacao',
        institution: 'UFC',
      } as never),
    ).resolves.toEqual(professor);

    expect(professorRepository.create.mock.calls).toEqual([
      [
        expect.objectContaining({
          email: 'prof@ufc.br',
          providerSubject: 'prof@ufc.br',
        }),
      ],
    ]);
  });

  it('finds professor by id', async () => {
    professorRepository.findById.mockResolvedValue(professor);

    await expect(service.findOne('user-1')).resolves.toEqual(professor);
  });

  it('throws when professor is not found by id', async () => {
    professorRepository.findById.mockResolvedValue(null);

    await expect(service.findOne('user-1')).rejects.toThrow(NotFoundException);
  });

  it('updates professor when unique constraints pass', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    professorRepository.update.mockResolvedValue(professor);

    await expect(
      service.update('user-1', {
        email: 'prof@ufc.br',
        department: 'Departamento de Computacao',
      }),
    ).resolves.toEqual(professor);
  });

  it('rejects duplicate email on update', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'other' } as never);

    await expect(
      service.update('user-1', {
        email: 'prof@ufc.br',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('removes professor when found', async () => {
    professorRepository.findById.mockResolvedValue(professor);
    professorRepository.remove.mockResolvedValue();

    await expect(service.remove('user-1')).resolves.toBeUndefined();
  });

  it('throws when removing missing professor', async () => {
    professorRepository.findById.mockResolvedValue(null);

    await expect(service.remove('user-1')).rejects.toThrow(NotFoundException);
  });

  it('disables professor account and revokes sessions', async () => {
    professorRepository.findById.mockResolvedValue({
      ...professor,
      status: StatusEnum.active,
    });
    professorRepository.update.mockResolvedValue({
      ...professor,
      status: StatusEnum.disabled,
    });

    await expect(
      service.disableAccount({ professorId: 'user-1', actorUserId: 'sec-1' }),
    ).resolves.toEqual({
      ...professor,
      status: StatusEnum.disabled,
    });

    expect(deleteByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(professorUpdateMock).toHaveBeenCalledWith('user-1', {
      status: StatusEnum.disabled,
    });
  });

  it('returns existing professor when already disabled', async () => {
    professorRepository.findById.mockResolvedValue({
      ...professor,
      status: StatusEnum.disabled,
    });

    await expect(
      service.disableAccount({ professorId: 'user-1', actorUserId: 'sec-1' }),
    ).resolves.toEqual({
      ...professor,
      status: StatusEnum.disabled,
    });

    expect(professorUpdateMock).not.toHaveBeenCalled();
    expect(deleteByUserIdMock).toHaveBeenCalledWith('user-1');
  });

  it('enables professor account when disabled', async () => {
    professorRepository.findById.mockResolvedValue({
      ...professor,
      status: StatusEnum.disabled,
    });
    professorRepository.update.mockResolvedValue({
      ...professor,
      status: StatusEnum.active,
    });

    await expect(
      service.enableAccount({ professorId: 'user-1', actorUserId: 'sec-1' }),
    ).resolves.toEqual({
      ...professor,
      status: StatusEnum.active,
    });

    expect(professorUpdateMock).toHaveBeenCalledWith('user-1', {
      status: StatusEnum.active,
    });
  });

  it('rejects enable when professor is inactive', async () => {
    professorRepository.findById.mockResolvedValue({
      ...professor,
      status: StatusEnum.inactive,
    });

    await expect(
      service.enableAccount({ professorId: 'user-1', actorUserId: 'sec-1' }),
    ).rejects.toThrow(BadRequestException);

    expect(professorUpdateMock).not.toHaveBeenCalled();
  });

  it('returns existing professor when already active', async () => {
    professorRepository.findById.mockResolvedValue({
      ...professor,
      status: StatusEnum.active,
    });

    await expect(
      service.enableAccount({ professorId: 'user-1', actorUserId: 'sec-1' }),
    ).resolves.toEqual({
      ...professor,
      status: StatusEnum.active,
    });

    expect(professorUpdateMock).not.toHaveBeenCalled();
  });
});
