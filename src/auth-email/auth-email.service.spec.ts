import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { getLoggerToken } from 'nestjs-pino';
import { AuthEmailService } from './auth-email.service';
import { UsersService } from '../users/users.service';
import { CandidateService } from '../candidate/candidate.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import type { User } from '../users/domain/user';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('AuthEmailService', () => {
  let service: AuthEmailService;
  let usersService: jest.Mocked<UsersService>;
  let candidateService: jest.Mocked<CandidateService>;
  let sessionService: jest.Mocked<SessionService>;
  let mailService: jest.Mocked<MailService>;
  let jwtService: jest.Mocked<JwtService>;

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
        AuthEmailService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findByCpf: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        { provide: CandidateService, useValue: { createProfile: jest.fn() } },
        {
          provide: SessionService,
          useValue: { deleteByUserId: jest.fn() },
        },
        { provide: MailService, useValue: { send: jest.fn() } },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
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
          provide: getLoggerToken(AuthEmailService.name),
          useValue: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthEmailService);
    usersService = module.get(UsersService);
    candidateService = module.get(CandidateService);
    sessionService = module.get(SessionService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
  });

  it('logs in email user with valid password', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await service.validateLogin({
      email: 'user@example.com',
      password: 'secret',
    });

    expect(result.user).toEqual(baseUser);
    expect(result.loginResponse).toMatchObject({
      userId: 'user-1',
      email: 'user@example.com',
      onboardingCompleted: true,
      mustChangePassword: false,
    });
  });

  it('rejects email login for google-backed user', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-sub',
      password: null,
    });

    await expect(
      service.validateLogin({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects email login when bootstrap password expired', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      mustChangePassword: true,
      bootstrapPasswordExpiresAt: new Date('2000-01-01T00:00:00.000Z'),
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      service.validateLogin({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects email login when user is disabled', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: StatusEnum.disabled,
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      service.validateLogin({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow('Usuario desativado. Entre em contato com a secretaria do programa.');
  });

  it('registers candidate with email provider metadata', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    usersService.create.mockResolvedValue(baseUser);
    jwtService.signAsync.mockResolvedValue('confirm-token');

    await service.register({
      email: 'User@Example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      cpf: '12345678901',
      universityOfOrigin: 'UFRN',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        authProvider: AuthProvidersEnum.email,
        providerSubject: 'user@example.com',
      }),
    );
    expect(candidateService.createProfile).toHaveBeenCalled();
    expect(mailService.send).toHaveBeenCalled();
  });

  it('rejects registration when email belongs to another provider', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-sub',
      password: null,
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

  it('increments forgot password token and sends email only for email users', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser);
    jwtService.signAsync.mockResolvedValue('forgot-token');

    await service.forgotPassword({ email: 'user@example.com' });

    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      forgotPasswordTokenVersion: 1,
    });
    expect(mailService.send).toHaveBeenCalled();
  });

  it('ignores forgot password for google-backed user', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-sub',
      password: null,
    });

    await service.forgotPassword({ email: 'user@example.com' });

    expect(usersService.update).not.toHaveBeenCalled();
    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('rejects password reset for google-backed user', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      forgotUserId: 'user-1',
      forgotPasswordTokenVersion: 0,
    });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-sub',
      password: null,
    });

    await expect(
      service.resetPassword({ hash: 'token', password: 'new-password' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates provider subject when confirming new email for email user', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 0,
      newEmail: 'new@example.com',
    });
    usersService.findById.mockResolvedValue(baseUser);
    usersService.findByEmail.mockResolvedValue(null);

    await service.confirmNewEmail({ hash: 'confirm-token' });

    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      providerSubject: 'new@example.com',
      status: StatusEnum.active,
      confirmEmailTokenVersion: 1,
    });
  });

  it('resets password and invalidates sessions for email user', async () => {
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
        password: 'new-hash',
        forgotPasswordTokenVersion: 1,
      }),
    );
    expect(sessionService.deleteByUserId).toHaveBeenCalledWith('user-1');
  });

  it('completes professor onboarding by setting password', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 1,
    });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      password: null,
      mustChangePassword: true,
      confirmEmailTokenVersion: 1,
    });
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    await service.completeProfessorOnboarding({ hash: 'confirm-token', password: 'new-pass' });

    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      password: 'new-hash',
      mustChangePassword: false,
      bootstrapPasswordExpiresAt: null,
      confirmEmailTokenVersion: 2,
      status: StatusEnum.active,
    });
  });

  it('rejects professor onboarding for non-email provider', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 1,
    });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-sub',
      password: null,
      mustChangePassword: true,
      confirmEmailTokenVersion: 1,
    });

    await expect(
      service.completeProfessorOnboarding({ hash: 'confirm-token', password: 'new-pass' }),
    ).rejects.toThrow('Conta cadastrada com outro provedor. Use seu provedor original.');
  });

  it('rejects professor onboarding for mismatched token version', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 1,
    });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      password: null,
      mustChangePassword: true,
      confirmEmailTokenVersion: 0,
    });

    await expect(
      service.completeProfessorOnboarding({ hash: 'confirm-token', password: 'new-pass' }),
    ).rejects.toThrow('Link de confirmacao invalido ou expirado.');
  });

  it('rejects professor onboarding when user is missing', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      confirmEmailUserId: 'user-1',
      confirmEmailTokenVersion: 1,
    });
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.completeProfessorOnboarding({ hash: 'confirm-token', password: 'new-pass' }),
    ).rejects.toThrow('Usuario nao encontrado.');
  });
});
