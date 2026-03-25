import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthGoogleController } from '../src/auth-google/auth-google.controller';
import { AuthEmailController } from '../src/auth-email/auth-email.controller';
import { AuthService } from '../src/auth/auth.service';
import { AuthGoogleService } from '../src/auth-google/auth-google.service';
import { AuthEmailService } from '../src/auth-email/auth-email.service';
import { AuthEmailGuard } from '../src/auth-email/auth-email.guard';
import { GoogleAuthGuard } from '../src/auth-google/guards/google-auth.guard';
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
  authProvider: string;
};

type OnboardingResponseBody = {
  onboardingCompleted: boolean;
};

type SessionRequest = {
  body: {
    email?: string;
    password?: string;
    idToken?: string;
  };
  user?: unknown;
  isAuthenticated(): boolean;
  session: {
    id: string;
    destroy(callback: (err?: unknown) => void): void;
  };
};

describe('Auth journeys (e2e)', () => {
  let app: INestApplication<App>;
  const authService = {
    validateSocialLogin: jest.fn(),
    completeCandidateOnboarding: jest.fn(),
  };
  const authEmailService = {
    validateLogin: jest.fn(),
    register: jest.fn(),
    confirmEmail: jest.fn(),
    confirmNewEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
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
    })
      .overrideGuard(AuthEmailGuard)
      .useValue({
        canActivate: async (context: ExecutionContext): Promise<boolean> => {
          const req = context.switchToHttp().getRequest<SessionRequest>();
          const result = (await authEmailService.validateLogin({
            email: req.body.email,
            password: req.body.password,
          })) as {
            user: unknown;
          };
          req.user = result.user;
          return true;
        },
      })
      .overrideGuard(GoogleAuthGuard)
      .useValue({
        canActivate: async (context: ExecutionContext): Promise<boolean> => {
          const req = context.switchToHttp().getRequest<SessionRequest>();
          const socialProfile = (await authGoogleService.getProfileByToken({
            idToken: req.body.idToken ?? '',
          })) as Record<string, unknown>;
          const result = (await authService.validateSocialLogin(
            AuthProvidersEnum.google,
            socialProfile,
          )) as {
            user: unknown;
          };
          req.user = result.user;
          return true;
        },
      })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(SessionLifecycleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(
      (
        req: {
          session?: SessionRequest['session'];
          user?: unknown;
          isAuthenticated?: () => boolean;
        },
        _res: unknown,
        next: () => void,
      ) => {
        req.session = {
          id: 'session-1',
          destroy: (cb: (err?: unknown) => void) => cb(),
        };
        req.user = {
          id: 'user-1',
          email: 'candidate@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          role: RoleEnum.candidate,
          status: StatusEnum.active,
          onboardingCompleted: true,
          mustChangePassword: false,
          authProvider: AuthProvidersEnum.email,
        };
        req.isAuthenticated = () => true;
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
        email: 'primary@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: RoleEnum.candidate,
        status: StatusEnum.active,
        onboardingCompleted: true,
        mustChangePassword: false,
        authProvider: AuthProvidersEnum.email,
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
    expect(body.authProvider).toBe('email');
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
    authGoogleService.getProfileByToken.mockResolvedValue({
      id: 'google-sub',
      email: 'candidate@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    authService.validateSocialLogin.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'candidate@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: RoleEnum.candidate,
        status: StatusEnum.active,
        onboardingCompleted: false,
        mustChangePassword: false,
        authProvider: AuthProvidersEnum.google,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/provider/google')
      .send({ idToken: 'google-token' })
      .expect(200);

    const body = response.body as LoginResponseBody;

    expect(authService.validateSocialLogin).toHaveBeenCalledWith(
      AuthProvidersEnum.google,
      expect.objectContaining({ id: 'google-sub' }),
    );
    expect(body.onboardingCompleted).toBe(false);
    expect(body.authProvider).toBe('google');
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
});
