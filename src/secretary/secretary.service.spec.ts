import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { InvitationService } from '../invitation/invitation.service';
import { RoleEnum } from '../roles/roles.enum';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import type { User } from '../users/domain/user';
import { UsersService } from '../users/users.service';
import { SecretaryService } from './secretary.service';

describe('SecretaryService', () => {
  let service: SecretaryService;
  let usersService: jest.Mocked<UsersService>;
  let invitationService: jest.Mocked<InvitationService>;
  let sessionService: jest.Mocked<SessionService>;

  const secretaryUser: User = {
    id: 'user-1',
    email: 'secretaria@ufc.br',
    firstName: 'Maria',
    lastName: 'Silva',
    role: RoleEnum.mdccSecretary,
    status: StatusEnum.active,
    authProvider: AuthProvidersEnum.email,
    providerSubject: 'secretaria@ufc.br',
    password: 'hashed',
    cpf: null,
    onboardingCompleted: true,
    mustChangePassword: false,
    bootstrapPasswordExpiresAt: null,
    confirmEmailTokenVersion: 0,
    forgotPasswordTokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretaryService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: InvitationService,
          useValue: {
            sendInvitation: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            deleteByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SecretaryService);
    usersService = module.get(UsersService);
    invitationService = module.get(InvitationService);
    sessionService = module.get(SessionService);
  });

  // ── invite ──────────────────────────────────────────────────────

  it('invites secretary and sends invitation', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(secretaryUser);

    await service.invite({ name: 'Maria Silva', email: 'secretaria@ufc.br' });

    expect(usersService.create.mock.calls).toEqual([
      [
        expect.objectContaining({
          email: 'secretaria@ufc.br',
          role: 'mdcc-secretary',
          status: 'inactive',
          mustChangePassword: true,
        }),
      ],
    ]);

    expect(invitationService.sendInvitation.mock.calls).toEqual([
      [
        expect.objectContaining({
          userId: 'user-1',
          email: 'secretaria@ufc.br',
          onboardingPath: '/auth/onboarding/secretary',
        }),
      ],
    ]);
  });

  it('rejects duplicate email', async () => {
    usersService.findByEmail.mockResolvedValue(secretaryUser);

    await expect(
      service.invite({ name: 'Maria Silva', email: 'secretaria@ufc.br' }),
    ).rejects.toThrow(ConflictException);
  });

  it('normalizes email on invite', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(secretaryUser);

    await service.invite({ name: 'Maria Silva', email: '  Secretaria@UFC.BR  ' });

    expect(usersService.create.mock.calls).toEqual([
      [
        expect.objectContaining({
          email: 'secretaria@ufc.br',
          providerSubject: 'secretaria@ufc.br',
        }),
      ],
    ]);
  });

  it('splits single-word name into firstName only', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(secretaryUser);

    await service.invite({ name: 'Maria', email: 'secretaria@ufc.br' });

    expect(usersService.create.mock.calls).toEqual([
      [
        expect.objectContaining({
          firstName: 'Maria',
          lastName: null,
        }),
      ],
    ]);
  });

  it('splits multi-word name into firstName and lastName', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(secretaryUser);

    await service.invite({ name: 'Maria da Silva Santos', email: 'secretaria@ufc.br' });

    expect(usersService.create.mock.calls).toEqual([
      [
        expect.objectContaining({
          firstName: 'Maria',
          lastName: 'da Silva Santos',
        }),
      ],
    ]);
  });

  // ── disableAccount ──────────────────────────────────────────────

  it('disables an active secretary and revokes sessions', async () => {
    usersService.findById.mockResolvedValue(secretaryUser);
    usersService.update.mockResolvedValue({ ...secretaryUser, status: StatusEnum.disabled });

    const result = await service.disableAccount({
      secretaryId: 'user-1',
      actorUserId: 'coordinator-1',
    });

    expect(result.status).toBe(StatusEnum.disabled);
    expect(usersService.update.mock.calls).toEqual([['user-1', { status: 'disabled' }]]);
    expect(sessionService.deleteByUserId.mock.calls).toEqual([['user-1']]);
  });

  it('returns secretary as-is when already disabled', async () => {
    const disabledUser = { ...secretaryUser, status: StatusEnum.disabled };
    usersService.findById.mockResolvedValue(disabledUser);

    const result = await service.disableAccount({
      secretaryId: 'user-1',
      actorUserId: 'coordinator-1',
    });

    expect(result.status).toBe(StatusEnum.disabled);
    expect(usersService.update.mock.calls).toHaveLength(0);
    expect(sessionService.deleteByUserId.mock.calls).toHaveLength(0);
  });

  it('throws NotFoundException when secretary not found on disable', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.disableAccount({ secretaryId: 'bad-id', actorUserId: 'coordinator-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when target user is not a secretary on disable', async () => {
    usersService.findById.mockResolvedValue({ ...secretaryUser, role: RoleEnum.professor });

    await expect(
      service.disableAccount({ secretaryId: 'user-1', actorUserId: 'coordinator-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  // ── enableAccount ───────────────────────────────────────────────

  it('enables a disabled secretary', async () => {
    const disabledUser = { ...secretaryUser, status: StatusEnum.disabled };
    usersService.findById.mockResolvedValue(disabledUser);
    usersService.update.mockResolvedValue({ ...secretaryUser, status: StatusEnum.active });

    const result = await service.enableAccount({
      secretaryId: 'user-1',
      actorUserId: 'coordinator-1',
    });

    expect(result.status).toBe(StatusEnum.active);
    expect(usersService.update.mock.calls).toEqual([['user-1', { status: 'active' }]]);
  });

  it('returns secretary as-is when already active', async () => {
    usersService.findById.mockResolvedValue(secretaryUser);

    const result = await service.enableAccount({
      secretaryId: 'user-1',
      actorUserId: 'coordinator-1',
    });

    expect(result.status).toBe(StatusEnum.active);
    expect(usersService.update.mock.calls).toHaveLength(0);
  });

  it('rejects enabling an inactive (pending) secretary', async () => {
    const inactiveUser = { ...secretaryUser, status: StatusEnum.inactive };
    usersService.findById.mockResolvedValue(inactiveUser);

    await expect(
      service.enableAccount({ secretaryId: 'user-1', actorUserId: 'coordinator-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when secretary not found on enable', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.enableAccount({ secretaryId: 'bad-id', actorUserId: 'coordinator-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
