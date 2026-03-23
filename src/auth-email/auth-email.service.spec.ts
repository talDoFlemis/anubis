/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { getLoggerToken } from 'nestjs-pino';
import { AuthEmailService } from './auth-email.service';
import { UsersService } from '../users/users.service';
import { CandidateService } from '../candidate/candidate.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { AuthGoogleService } from '../auth-google/auth-google.service';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthEmailService', () => {
  let service: AuthEmailService;
  let usersService: jest.Mocked<UsersService>;
  let candidateService: jest.Mocked<CandidateService>;
  let sessionService: jest.Mocked<SessionService>;
  let mailService: jest.Mocked<MailService>;
  let jwtService: jest.Mocked<JwtService>;
  let authGoogleService: jest.Mocked<AuthGoogleService>;

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
        AuthEmailService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findUserByOwnedVerifiedEmail: jest.fn(),
            findById: jest.fn(),
            findByCpf: jest.fn(),
            findByProviderAccount: jest.fn(),
            listUserEmails: jest.fn(),
            attachOwnedEmail: jest.fn(),
            promoteOwnedEmailToPrimary: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            linkProviderAccount: jest.fn(),
            hasProviderAccount: jest.fn(),
          },
        },
        {
          provide: CandidateService,
          useValue: {
            createProfile: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            deleteByUserId: jest.fn(),
            deleteByUserIdWithExclude: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: { send: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const map: Record<string, string> = {
                AUTH_CONFIRM_EMAIL_SECRET: 'confirm-secret',
                AUTH_CONFIRM_EMAIL_EXPIRES_IN: '1d',
                AUTH_FORGOT_SECRET: 'forgot-secret',
                AUTH_FORGOT_EXPIRES_IN: '1d',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return map[key] ?? key;
            }),
          },
        },
        {
          provide: AuthGoogleService,
          useValue: {
            getProfileByToken: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(AuthEmailService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthEmailService);
    usersService = module.get(UsersService);
    candidateService = module.get(CandidateService);
    sessionService = module.get(SessionService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    authGoogleService = module.get(AuthGoogleService);
  });

  it('rejects email login when bootstrap password expired', async () => {
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue({
      ...baseUser,
      mustChangePassword: true,
      bootstrapPasswordExpiresAt: new Date('2000-01-01T00:00:00.000Z'),
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      service.validateLogin({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logs in with a verified owned secondary e-mail', async () => {
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue(baseUser);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await service.validateLogin({
      email: 'secondary@example.com',
      password: 'secret',
    });

    expect(usersService.findUserByOwnedVerifiedEmail).toHaveBeenCalledWith(
      'secondary@example.com',
    );
    expect(usersService.findByEmail).not.toHaveBeenCalled();
    expect(result.user).toEqual(baseUser);
    expect(result.loginResponse.linkedProviders).toEqual([
      AuthProvidersEnum.email,
    ]);
  });

  it('registers candidate and sends generic mail', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    usersService.create.mockResolvedValue(baseUser);
    jwtService.signAsync.mockResolvedValue('confirm-token');

    await service.register({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      cpf: '12345678901',
      universityOfOrigin: 'UFRN',
    });

    expect(candidateService.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ universityOfOrigin: 'UFRN' }),
    );
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        title: 'Confirme seu email - Anubis',
      }),
    );
  });

  it('rejects registration collision with non-email provider dynamically', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      linkedProviders: [AuthProvidersEnum.google],
    });

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        cpf: '12345678901',
        universityOfOrigin: 'UFRN',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('requires provider proof and invalidates other sessions when linking email', async () => {
    usersService.findById
      .mockResolvedValueOnce({
        ...baseUser,
        linkedProviders: [AuthProvidersEnum.google],
        password: null,
      })
      .mockResolvedValueOnce({
        ...baseUser,
        linkedProviders: [AuthProvidersEnum.google, AuthProvidersEnum.email],
      });
    usersService.hasProviderAccount.mockResolvedValue(false);
    authGoogleService.getProfileByToken.mockResolvedValue({
      id: 'google-1',
      email: 'user@example.com',
    });
    usersService.findByProviderAccount.mockResolvedValue({
      ...baseUser,
      id: 'user-1',
      linkedProviders: [AuthProvidersEnum.google],
    });
    usersService.promoteOwnedEmailToPrimary.mockResolvedValue({
      ...baseUser,
      email: 'alias@example.com',
      linkedProviders: [AuthProvidersEnum.google, AuthProvidersEnum.email],
    });
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

    await service.linkEmailProvider('user-1', 'sid-1', {
      password: 'password123',
      provider: AuthProvidersEnum.google,
      providerToken: 'google-token',
    });

    expect(usersService.linkProviderAccount).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: AuthProvidersEnum.email,
      socialId: null,
    });
    expect(sessionService.deleteByUserIdWithExclude).toHaveBeenCalledWith({
      userId: 'user-1',
      excludeSessionId: 'sid-1',
    });
    expect(usersService.listUserEmails).not.toHaveBeenCalled();
  });

  it('links email provider using explicitly selected owned verified e-mail account', async () => {
    usersService.findById
      .mockResolvedValueOnce({
        ...baseUser,
        linkedProviders: [AuthProvidersEnum.google],
        password: null,
      })
      .mockResolvedValueOnce({
        ...baseUser,
        linkedProviders: [AuthProvidersEnum.google, AuthProvidersEnum.email],
      });
    usersService.hasProviderAccount.mockResolvedValue(false);
    usersService.listUserEmails.mockResolvedValue([
      {
        accountId: null,
        email: 'user@example.com',
        normalizedEmail: 'user@example.com',
        verifiedAt: null,
        verificationTokenVersion: 0,
        isPrimary: true,
      },
      {
        accountId: 'owned-verified-id',
        email: 'alias@example.com',
        normalizedEmail: 'alias@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        verificationTokenVersion: 0,
        isPrimary: false,
      },
    ]);
    authGoogleService.getProfileByToken.mockResolvedValue({
      id: 'google-1',
      email: 'user@example.com',
    });
    usersService.findByProviderAccount.mockResolvedValue({
      ...baseUser,
      id: 'user-1',
      linkedProviders: [AuthProvidersEnum.google],
    });
    usersService.promoteOwnedEmailToPrimary.mockResolvedValue({
      ...baseUser,
      email: 'alias@example.com',
      linkedProviders: [AuthProvidersEnum.google, AuthProvidersEnum.email],
    });
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

    await service.linkEmailProvider('user-1', 'sid-1', {
      password: 'password123',
      provider: AuthProvidersEnum.google,
      providerToken: 'google-token',
      ownedEmailAccountId: 'owned-verified-id',
    });

    expect(usersService.listUserEmails).toHaveBeenCalledWith('user-1');
    expect(usersService.linkProviderAccount).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: AuthProvidersEnum.email,
      socialId: null,
    });
    expect(usersService.promoteOwnedEmailToPrimary).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'owned-verified-id',
    });
  });

  it('rejects linking when explicit owned e-mail account is missing or from another user', async () => {
    usersService.findById.mockResolvedValue({
      ...baseUser,
      linkedProviders: [AuthProvidersEnum.google],
      password: null,
    });
    usersService.hasProviderAccount.mockResolvedValue(false);
    usersService.listUserEmails.mockResolvedValue([
      {
        accountId: null,
        email: 'user@example.com',
        normalizedEmail: 'user@example.com',
        verifiedAt: null,
        verificationTokenVersion: 0,
        isPrimary: true,
      },
    ]);

    await expect(
      service.linkEmailProvider('user-1', 'sid-1', {
        password: 'password123',
        provider: AuthProvidersEnum.google,
        providerToken: 'google-token',
        ownedEmailAccountId: 'not-owned-id',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(authGoogleService.getProfileByToken).not.toHaveBeenCalled();
    expect(usersService.linkProviderAccount).not.toHaveBeenCalled();
  });

  it('rejects linking when explicit owned e-mail account is unverified', async () => {
    usersService.findById.mockResolvedValue({
      ...baseUser,
      linkedProviders: [AuthProvidersEnum.google],
      password: null,
    });
    usersService.hasProviderAccount.mockResolvedValue(false);
    usersService.listUserEmails.mockResolvedValue([
      {
        accountId: null,
        email: 'user@example.com',
        normalizedEmail: 'user@example.com',
        verifiedAt: null,
        verificationTokenVersion: 0,
        isPrimary: true,
      },
      {
        accountId: 'owned-unverified-id',
        email: 'unverified@example.com',
        normalizedEmail: 'unverified@example.com',
        verifiedAt: null,
        verificationTokenVersion: 1,
        isPrimary: false,
      },
    ]);

    await expect(
      service.linkEmailProvider('user-1', 'sid-1', {
        password: 'password123',
        provider: AuthProvidersEnum.google,
        providerToken: 'google-token',
        ownedEmailAccountId: 'owned-unverified-id',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(authGoogleService.getProfileByToken).not.toHaveBeenCalled();
    expect(usersService.linkProviderAccount).not.toHaveBeenCalled();
  });

  it('consumes forgot/reset token versions to reduce replay risk', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      forgotUserId: 'user-1',
      forgotPasswordTokenVersion: 0,
    });
    usersService.findById.mockResolvedValue(baseUser);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    await service.resetPassword({ hash: 'token', password: 'new-password' });

    expect(usersService.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        forgotPasswordTokenVersion: 1,
        bootstrapPasswordExpiresAt: null,
      }),
    );
  });

  it('sends forgot-password mail for a verified owned secondary e-mail', async () => {
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue(baseUser);
    jwtService.signAsync.mockResolvedValue('forgot-token');

    await service.forgotPassword({ email: 'secondary@example.com' });

    expect(usersService.findUserByOwnedVerifiedEmail).toHaveBeenCalledWith(
      'secondary@example.com',
    );
    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      forgotPasswordTokenVersion: 1,
    });
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'secondary@example.com',
        title: 'Redefina sua senha - Anubis',
      }),
    );
  });

  it('attaches and promotes confirmed new e-mail instead of overwriting user e-mail directly', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 0,
      newEmail: 'new-primary@example.com',
    });
    usersService.findById.mockResolvedValue(baseUser);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue(null);
    usersService.listUserEmails.mockResolvedValue([
      {
        accountId: 'primary-account',
        email: 'user@example.com',
        normalizedEmail: 'user@example.com',
        verifiedAt: null,
        verificationTokenVersion: 0,
        isPrimary: true,
      },
    ]);
    usersService.attachOwnedEmail.mockResolvedValue({
      accountId: 'secondary-account',
      email: 'new-primary@example.com',
      normalizedEmail: 'new-primary@example.com',
      verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
      verificationTokenVersion: 0,
      isPrimary: false,
    });
    usersService.promoteOwnedEmailToPrimary.mockResolvedValue(baseUser);

    await service.confirmNewEmail({ hash: 'confirm-token' });

    expect(usersService.attachOwnedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'new-primary@example.com',
        normalizedEmail: 'new-primary@example.com',
        verifiedAt: expect.any(Date),
      }),
    );
    expect(usersService.promoteOwnedEmailToPrimary).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'secondary-account',
    });
    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      status: StatusEnum.active,
      confirmEmailTokenVersion: 1,
    });
    expect(usersService.update).not.toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ email: 'new-primary@example.com' }),
    );
  });

  it('rejects confirm new e-mail when address was claimed after token issuance', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 0,
      newEmail: 'taken@example.com',
    });
    usersService.findById.mockResolvedValue(baseUser);
    usersService.findUserByOwnedVerifiedEmail.mockResolvedValue({
      ...baseUser,
      id: 'user-2',
      email: 'taken@example.com',
    });

    await expect(
      service.confirmNewEmail({ hash: 'confirm-token' }),
    ).rejects.toThrow(ConflictException);

    expect(usersService.update).not.toHaveBeenCalled();
  });
});
