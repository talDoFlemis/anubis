import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { getLoggerToken } from 'nestjs-pino';
import { CandidateService } from '../candidate/candidate.service';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import type { User } from '../users/domain/user';
import { UsersService } from '../users/users.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthService } from './auth.service';

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
            resolveSnapshotChange: jest.fn().mockImplementation(({ passwordChanged }) => ({
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
    // ARRANGE
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
    const userCreateSpy = jest.spyOn(usersService, 'create');

    // ACT
    const result = await service.validateSocialLogin(AuthProvidersEnum.google, {
      id: 'google-1',
      email: 'new@example.com',
      verified_email: true,
    });

    // ASSERT
    expect(userCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        authProvider: AuthProvidersEnum.google,
        providerSubject: 'google-1',
        onboardingCompleted: false,
      }),
    );
    expect(result.loginResponse).toMatchObject({
      userId: 'new-user',
      onboardingCompleted: false,
      mustChangePassword: false,
    });
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
    // ARRANGE
    usersService.findById
      .mockResolvedValueOnce({
        ...baseUser,
        mustChangePassword: true,
        bootstrapPasswordExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce(baseUser);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    const deleteByUserIdWithExcludeSpy = jest.spyOn(sessionService, 'deleteByUserIdWithExclude');
    const updateUserSpy = jest.spyOn(usersService, 'update');

    // ACT
    await service.update('user-1', 'sid-1', {
      oldPassword: 'old',
      password: 'new-password',
    });

    // ASSERT
    expect(deleteByUserIdWithExcludeSpy).toHaveBeenCalled();
    expect(updateUserSpy).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        password: 'new-hash',
        mustChangePassword: false,
      }),
    );
  });

  it('delegates candidate onboarding to CandidateService', async () => {
    // ARRANGE
    const completeOnboardingSpy = jest.spyOn(candidateService, 'completeOnboarding');

    usersService.findById.mockResolvedValue(baseUser);

    // ACT
    await service.completeCandidateOnboarding('user-1', {
      firstName: 'John',
      lastName: 'Doe',
      cpf: '12345678901',
      universityOfOrigin: 'UFRN',
      ira: '8.75',
    });

    // ASSERT
    expect(completeOnboardingSpy).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ cpf: '12345678901' }),
    );
  });
});
