/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { getLoggerToken } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { CandidateService } from '../candidate/candidate.service';
import { MailService } from '../mail/mail.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionService: jest.Mocked<SessionService>;
  let candidateService: jest.Mocked<CandidateService>;

  const baseUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hash',
    cpf: '12345678901',
    firstName: 'John',
    lastName: 'Doe',
    role: RoleEnum.candidate,
    status: StatusEnum.active,
    onboardingCompleted: true,
    mustChangePassword: false,
    bootstrapPasswordExpiresAt: null,
    confirmEmailTokenVersion: 0,
    forgotPasswordTokenVersion: 0,
    linkedProviders: [AuthProvidersEnum.email],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findUserByOwnedVerifiedEmail: jest.fn(),
            findByCpf: jest.fn(),
            findByProviderAccount: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            linkProviderAccount: jest.fn(),
            hasProviderAccount: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            deleteByUserId: jest.fn(),
            deleteByUserIdWithExclude: jest.fn(),
            resolveSnapshotChange: jest
              .fn()
              .mockImplementation(({ passwordChanged }) => ({
                revokeAllSessions: false,
                revokeOtherSessions: Boolean(passwordChanged),
                refreshCurrentSession: false,
              })),
          },
        },
        {
          provide: CandidateService,
          useValue: {
            completeOnboarding: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn(() => 'secret') },
        },
        {
          provide: MailService,
          useValue: { send: jest.fn() },
        },
        {
          provide: getLoggerToken(AuthService.name),
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = await module.resolve(AuthService);
    usersService = module.get(UsersService);
    sessionService = module.get(SessionService);
    candidateService = module.get(CandidateService);
  });

  it('uses provider-agnostic collision message on social login collision', async () => {
    usersService.findByProviderAccount.mockResolvedValue(null);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue({
      ...baseUser,
      linkedProviders: [AuthProvidersEnum.email, AuthProvidersEnum.google],
    });

    await expect(
      service.validateSocialLogin(AuthProvidersEnum.google, {
        id: 'google-1',
        email: 'user@example.com',
      }),
    ).rejects.toThrow(ConflictException);

    expect(usersService.findUserByOwnedVerifiedEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
  });

  it('requires explicit linking when social email matches an owned verified email', async () => {
    usersService.findByProviderAccount.mockResolvedValue(null);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue({
      ...baseUser,
      linkedProviders: [AuthProvidersEnum.email],
    });

    await expect(
      service.validateSocialLogin(AuthProvidersEnum.google, {
        id: 'google-1',
        email: 'user@example.com',
      }),
    ).rejects.toMatchObject({
      response: {
        message:
          'Este e-mail ja possui conta existente. Entre com email e vincule google explicitamente.',
      },
    });
  });

  it('creates onboarding-incomplete candidate on first social signup', async () => {
    usersService.findByProviderAccount.mockResolvedValue(null);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      ...baseUser,
      id: 'new-user',
      onboardingCompleted: false,
      linkedProviders: [],
    });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      id: 'new-user',
      onboardingCompleted: false,
      linkedProviders: [AuthProvidersEnum.google],
    });

    const result = await service.validateSocialLogin(AuthProvidersEnum.google, {
      id: 'google-1',
      email: 'new@example.com',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingCompleted: false }),
    );
    expect(result.loginResponse.onboardingCompleted).toBe(false);
  });

  it('links google when provider email is an owned verified email on the current user', async () => {
    usersService.findById
      .mockResolvedValueOnce(baseUser)
      .mockResolvedValueOnce({
        ...baseUser,
        linkedProviders: [AuthProvidersEnum.email, AuthProvidersEnum.google],
      });
    usersService.hasProviderAccount.mockResolvedValue(false);
    usersService.findByProviderAccount.mockResolvedValue(null);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue(baseUser);
    usersService.linkProviderAccount.mockResolvedValue(undefined as never);

    const result = await service.linkGoogleProvider('user-1', {
      id: 'google-1',
      email: 'user@example.com',
    });

    expect(usersService.findUserByOwnedVerifiedEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(usersService.linkProviderAccount).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: AuthProvidersEnum.google,
      socialId: 'google-1',
    });
    expect(result.linkedProviders).toEqual([
      AuthProvidersEnum.email,
      AuthProvidersEnum.google,
    ]);
  });

  it('rejects google linking when provider email belongs to a different owned verified user', async () => {
    usersService.findById.mockResolvedValue(baseUser);
    usersService.hasProviderAccount.mockResolvedValue(false);
    usersService.findByProviderAccount.mockResolvedValue(null);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue({
      ...baseUser,
      id: 'user-2',
      email: 'owned-by-other@example.com',
    });

    await expect(
      service.linkGoogleProvider('user-1', {
        id: 'google-1',
        email: 'owned-by-other@example.com',
      }),
    ).rejects.toMatchObject({
      response: {
        message: 'Este e-mail do provedor google ja pertence a outro usuario.',
      },
    });

    expect(usersService.linkProviderAccount).not.toHaveBeenCalled();
  });

  it('restricts mustChangePassword user to password-only profile update', async () => {
    usersService.findById.mockResolvedValue({
      ...baseUser,
      mustChangePassword: true,
    });

    await expect(
      service.update('user-1', 'sid-1', {
        firstName: 'Changed',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows password update and clears bootstrap restrictions', async () => {
    usersService.findById
      .mockResolvedValueOnce({
        ...baseUser,
        mustChangePassword: true,
        bootstrapPasswordExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce(baseUser);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    await service.update('user-1', 'sid-1', {
      oldPassword: 'old',
      password: 'new-password',
    });

    expect(sessionService.deleteByUserIdWithExclude).toHaveBeenCalled();
    expect(usersService.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        password: 'new-hash',
        mustChangePassword: false,
        bootstrapPasswordExpiresAt: null,
      }),
    );
  });

  it('does not invalidate other sessions when profile validation fails', async () => {
    usersService.findById.mockResolvedValue(baseUser);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      id: 'user-2',
      email: 'taken@example.com',
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      service.update('user-1', 'sid-1', {
        oldPassword: 'old',
        password: 'new-password',
        email: 'taken@example.com',
      }),
    ).rejects.toThrow(ConflictException);

    expect(sessionService.deleteByUserIdWithExclude).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
  });

  it('delegates candidate onboarding to CandidateService', async () => {
    usersService.findById.mockResolvedValue(baseUser);

    await service.completeCandidateOnboarding('user-1', {
      firstName: 'John',
      lastName: 'Doe',
      cpf: '12345678901',
      universityOfOrigin: 'UFRN',
    });

    expect(candidateService.completeOnboarding).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ cpf: '12345678901' }),
    );
  });
});
