import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthGoogleController } from '../src/auth-google/auth-google.controller';
import { AuthEmailController } from '../src/auth-email/auth-email.controller';
import { AuthService } from '../src/auth/auth.service';
import { AuthGoogleService } from '../src/auth-google/auth-google.service';
import { AuthEmailService } from '../src/auth-email/auth-email.service';
import { SessionAuthGuard } from '../src/auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../src/auth/guards/session-lifecycle.guard';
import { RoleEnum } from '../src/roles/roles.enum';
import { StatusEnum } from '../src/statuses/statuses.enum';
import { AuthProvidersEnum } from '../src/auth/auth-providers.enum';
import { getLoggerToken } from 'nestjs-pino';
import { UsersService } from '../src/users/users.service';
import { Reflector } from '@nestjs/core';

type LoginResponseBody = {
  onboardingCompleted: boolean;
  linkedProviders: string[];
};

type OnboardingResponseBody = {
  onboardingCompleted: boolean;
};

type LinkProviderResponseBody = {
  linkedProviders: string[];
};

describe('Auth journeys (e2e)', () => {
  let app: INestApplication<App>;
  const authService = {
    validateSocialLogin: jest.fn(),
    completeCandidateOnboarding: jest.fn(),
    linkGoogleProvider: jest.fn(),
  };
  const authEmailService = {
    validateLogin: jest.fn(),
    register: jest.fn(),
    confirmEmail: jest.fn(),
    confirmNewEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    linkEmailProvider: jest.fn(),
  };
  const authGoogleService = {
    getProfileByToken: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, AuthEmailController, AuthGoogleController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthEmailService, useValue: authEmailService },
        { provide: AuthGoogleService, useValue: authGoogleService },
        SessionAuthGuard,
        SessionLifecycleGuard,
        {
          provide: getLoggerToken(SessionAuthGuard.name),
          useValue: { warn: jest.fn(), debug: jest.fn() },
        },
        {
          provide: getLoggerToken(SessionLifecycleGuard.name),
          useValue: {
            warn: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: 'user-1',
              onboardingCompleted: true,
              mustChangePassword: false,
            }),
          },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue([]) },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      (
        req: { session?: Record<string, unknown> },
        _res: unknown,
        next: () => void,
      ) => {
        req.session = {
          id: 'session-1',
          userId: 'user-1',
          userRole: RoleEnum.candidate,
          role: RoleEnum.candidate,
          status: StatusEnum.active,
          onboardingCompleted: true,
          mustChangePassword: false,
          regenerate: (cb: (err?: unknown) => void) => cb(),
          destroy: (cb: (err?: unknown) => void) => cb(),
        };
        next();
      },
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers candidate via email with required candidate fields', async () => {
    authEmailService.register.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/auth/provider/email/register')
      .send({
        email: 'candidate@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        cpf: '12345678901',
        universityOfOrigin: 'UFRN',
      })
      .expect(204);

    expect(authEmailService.register).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: '12345678901',
        universityOfOrigin: 'UFRN',
      }),
    );
  });

  it('logs in via the regrouped email provider route', async () => {
    authEmailService.validateLogin.mockResolvedValue({
      user: {
        id: 'user-1',
        role: RoleEnum.candidate,
      },
      loginResponse: {
        userId: 'user-1',
        email: 'primary@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: RoleEnum.candidate,
        status: StatusEnum.active,
        linkedProviders: [AuthProvidersEnum.email, AuthProvidersEnum.google],
        onboardingCompleted: true,
        mustChangePassword: false,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/provider/email/login')
      .send({
        email: 'secondary@example.com',
        password: 'password123',
      })
      .expect(200);

    const body = response.body as LoginResponseBody;

    expect(authEmailService.validateLogin).toHaveBeenCalledWith({
      email: 'secondary@example.com',
      password: 'password123',
    });
    expect(body.onboardingCompleted).toBe(true);
    expect(body.linkedProviders).toEqual(['email', 'google']);
  });

  it('confirms a new e-mail via the regrouped email provider route', async () => {
    authEmailService.confirmNewEmail.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/auth/provider/email/confirm/new')
      .send({ hash: 'confirm-hash' })
      .expect(204);

    expect(authEmailService.confirmNewEmail).toHaveBeenCalledWith({
      hash: 'confirm-hash',
    });
  });

  it('requests password reset via the regrouped email provider route', async () => {
    authEmailService.forgotPassword.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/auth/provider/email/forgot/password')
      .send({ email: 'secondary@example.com' })
      .expect(204);

    expect(authEmailService.forgotPassword).toHaveBeenCalledWith({
      email: 'secondary@example.com',
    });
  });

  it('logs in with google and returns lifecycle flags', async () => {
    const loginResponse = {
      userId: 'user-1',
      email: 'candidate@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      linkedProviders: [AuthProvidersEnum.google],
      onboardingCompleted: false,
      mustChangePassword: false,
    };

    authGoogleService.getProfileByToken.mockResolvedValue({
      id: 'google-sub',
      email: 'candidate@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    authService.validateSocialLogin.mockResolvedValue({
      user: {
        id: 'user-1',
        role: RoleEnum.candidate,
      },
      loginResponse,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/provider/google/login')
      .send({ idToken: 'google-token' })
      .expect(200);

    const body = response.body as LoginResponseBody;

    expect(body.onboardingCompleted).toBe(false);
    expect(body.linkedProviders).toEqual(['google']);
  });

  it('links google provider when the provider email is owned by the authenticated user', async () => {
    authGoogleService.getProfileByToken.mockResolvedValue({
      id: 'google-sub',
      email: 'candidate@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    authService.linkGoogleProvider.mockResolvedValue({
      id: 'user-1',
      linkedProviders: [AuthProvidersEnum.email, AuthProvidersEnum.google],
    });

    const response = await request(app.getHttpServer())
      .post('/auth/provider/google/link')
      .send({ idToken: 'google-token' })
      .expect(200);

    const body = response.body as LinkProviderResponseBody;

    expect(authService.linkGoogleProvider).toHaveBeenCalledWith('user-1', {
      id: 'google-sub',
      email: 'candidate@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    expect(body.linkedProviders).toEqual(['email', 'google']);
  });

  it('rejects google provider linking when the provider email belongs to another user', async () => {
    authGoogleService.getProfileByToken.mockResolvedValue({
      id: 'google-sub',
      email: 'owned-by-other@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    authService.linkGoogleProvider.mockRejectedValue(
      new ConflictException({
        message: 'Este e-mail do provedor google ja pertence a outro usuario.',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/auth/provider/google/link')
      .send({ idToken: 'google-token' })
      .expect(409);

    expect(response.body.message).toBe(
      'Este e-mail do provedor google ja pertence a outro usuario.',
    );
  });

  it('completes candidate onboarding from an authenticated session', async () => {
    authService.completeCandidateOnboarding.mockResolvedValue({
      id: 'user-1',
      onboardingCompleted: true,
      cpf: '12345678901',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/onboarding/candidate')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        cpf: '12345678901',
        universityOfOrigin: 'UFRN',
      })
      .expect(200);

    const body = response.body as OnboardingResponseBody;

    expect(authService.completeCandidateOnboarding).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ cpf: '12345678901' }),
    );
    expect(body.onboardingCompleted).toBe(true);
  });

  it('links email provider with proof from authenticated session', async () => {
    authEmailService.linkEmailProvider.mockResolvedValue({
      id: 'user-1',
      linkedProviders: [AuthProvidersEnum.google, AuthProvidersEnum.email],
    });

    const response = await request(app.getHttpServer())
      .post('/auth/provider/email/link')
      .send({
        password: 'password123',
        provider: AuthProvidersEnum.google,
        providerToken: 'google-id-token',
      })
      .expect(200);

    const body = response.body as LinkProviderResponseBody;

    expect(authEmailService.linkEmailProvider).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      expect.objectContaining({ provider: 'google' }),
    );
    expect(body.linkedProviders).toEqual(['google', 'email']);
  });

  it('forwards ownedEmailAccountId on email-provider link requests', async () => {
    authEmailService.linkEmailProvider.mockResolvedValue({
      id: 'user-1',
      linkedProviders: [AuthProvidersEnum.google, AuthProvidersEnum.email],
    });

    await request(app.getHttpServer())
      .post('/auth/provider/email/link')
      .send({
        password: 'password123',
        provider: AuthProvidersEnum.google,
        providerToken: 'google-id-token',
        ownedEmailAccountId: 'b7c2f7c0-7b5f-4b61-9b74-2fc5f47a8f8e',
      })
      .expect(200);

    expect(authEmailService.linkEmailProvider).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      expect.objectContaining({
        provider: 'google',
        ownedEmailAccountId: 'b7c2f7c0-7b5f-4b61-9b74-2fc5f47a8f8e',
      }),
    );
  });
});
