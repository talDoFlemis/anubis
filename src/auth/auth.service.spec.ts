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

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionService: jest.Mocked<SessionService>;
  let candidateService: jest.Mocked<CandidateService>;

  const baseUser: User = {
    id: 'user-1',
    authProvider: AuthProvidersEnum.email,
    providerSubject: 'user@example.com',
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
            findByCpf: jest.fn(),
            findByAuthProvider: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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
          useValue: { completeOnboarding: jest.fn() },
        },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn(() => 'secret') },
        },
        { provide: MailService, useValue: { send: jest.fn() } },
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

  it('rejects social login when email belongs to another provider', async () => {
    usersService.findByAuthProvider.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.email,
    });

    await expect(
      service.validateSocialLogin(AuthProvidersEnum.google, {
        id: 'google-1',
        email: 'user@example.com',
        verified_email: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates onboarding-incomplete candidate on first social signup', async () => {
    usersService.findByAuthProvider.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      ...baseUser,
      id: 'new-user',
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-1',
      password: null,
      onboardingCompleted: false,
    });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      id: 'new-user',
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-1',
      password: null,
      onboardingCompleted: false,
    });

    const result = await service.validateSocialLogin(AuthProvidersEnum.google, {
      id: 'google-1',
      email: 'new@example.com',
      verified_email: true,
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authProvider: AuthProvidersEnum.google,
        providerSubject: 'google-1',
        onboardingCompleted: false,
      }),
    );
    expect(result.loginResponse.authProvider).toBe(AuthProvidersEnum.google);
  });

  it('returns existing social user when provider subject matches', async () => {
    usersService.findByAuthProvider.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-1',
      password: null,
    });

    const result = await service.validateSocialLogin(AuthProvidersEnum.google, {
      id: 'google-1',
      email: 'user@example.com',
      verified_email: true,
    });

    expect(result.user.authProvider).toBe(AuthProvidersEnum.google);
  });

  it('rejects password change for non-email accounts', async () => {
    usersService.findById.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-1',
      password: null,
    });

    await expect(
      service.update('user-1', 'sid-1', {
        oldPassword: 'old',
        password: 'new-password',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows password update for email accounts and revokes other sessions', async () => {
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
      }),
    );
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
