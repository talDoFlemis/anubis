import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { getLoggerToken } from 'nestjs-pino';
import { SessionAuthGuard } from '../src/auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../src/auth/guards/session-lifecycle.guard';
import { ProfessorsController } from '../src/professors/professors.controller';
import { ProfessorsService } from '../src/professors/professors.service';
import { RolesGuard } from '../src/roles/roles.guard';
import { RoleEnum } from '../src/roles/roles.enum';
import { StatusEnum } from '../src/statuses/statuses.enum';
import { UsersService } from '../src/users/users.service';

describe('Professors invite authorization (e2e)', () => {
  let app: INestApplication<App>;

  const professorsService = {
    inviteProfessor: jest.fn(),
  };

  const usersService = {
    findById: jest.fn(),
  };

  let sessionData: {
    userId?: string;
    userRole?: RoleEnum;
    status?: StatusEnum;
    onboardingCompleted?: boolean;
    mustChangePassword?: boolean;
  } = {
    userId: 'user-1',
    userRole: RoleEnum.mdccSecretary,
    status: StatusEnum.active,
    onboardingCompleted: true,
    mustChangePassword: false,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfessorsController],
      providers: [
        { provide: ProfessorsService, useValue: professorsService },
        { provide: UsersService, useValue: usersService },
        SessionAuthGuard,
        SessionLifecycleGuard,
        RolesGuard,
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
          provide: getLoggerToken(RolesGuard.name),
          useValue: { warn: jest.fn(), debug: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      (
        req: {
          session?: {
            id: string;
            regenerate: (cb: (err?: unknown) => void) => void;
            destroy: (cb: (err?: unknown) => void) => void;
            userId?: string;
            userRole?: RoleEnum;
            role?: RoleEnum;
            status?: StatusEnum;
            onboardingCompleted?: boolean;
            mustChangePassword?: boolean;
          };
        },
        _res: unknown,
        next: () => void,
      ) => {
        req.session = {
          id: 'session-1',
          regenerate: (cb: (err?: unknown) => void) => cb(),
          destroy: (cb: (err?: unknown) => void) => cb(),
          userId: sessionData.userId,
          userRole: sessionData.userRole,
          role: sessionData.userRole,
          status: sessionData.status,
          onboardingCompleted: sessionData.onboardingCompleted,
          mustChangePassword: sessionData.mustChangePassword,
        };
        next();
      },
    );
    app.setGlobalPrefix('');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    sessionData = {
      userId: 'user-1',
      userRole: RoleEnum.mdccSecretary,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: false,
    };
    professorsService.inviteProfessor.mockResolvedValue(undefined);
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      onboardingCompleted: true,
      mustChangePassword: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows mdcc-secretary to invite a professor', async () => {
    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(204);

    expect(professorsService.inviteProfessor).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'prof@example.com' }),
    );
  });

  it('allows post-graduate-coordinator to invite a professor', async () => {
    sessionData.userRole = RoleEnum.postGraduateCoordinator;

    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(204);

    expect(professorsService.inviteProfessor).toHaveBeenCalledTimes(1);
  });

  it('blocks unauthenticated sessions', async () => {
    sessionData = {};

    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(401);

    expect(professorsService.inviteProfessor).not.toHaveBeenCalled();
  });

  it('blocks candidate sessions', async () => {
    sessionData.userRole = RoleEnum.candidate;

    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(403);

    expect(professorsService.inviteProfessor).not.toHaveBeenCalled();
  });

  it('blocks professor sessions', async () => {
    sessionData.userRole = RoleEnum.professor;

    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(403);

    expect(professorsService.inviteProfessor).not.toHaveBeenCalled();
  });

  it('blocks must-change-password restricted sessions', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      onboardingCompleted: true,
      mustChangePassword: true,
    });
    sessionData.mustChangePassword = true;

    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(403);

    expect(professorsService.inviteProfessor).not.toHaveBeenCalled();
  });

  it('blocks onboarding-incomplete restricted sessions', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      onboardingCompleted: false,
      mustChangePassword: false,
    });
    sessionData.onboardingCompleted = false;

    await request(app.getHttpServer())
      .post('/v1/professors/invite')
      .send({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        cpf: '12345678901',
      })
      .expect(403);

    expect(professorsService.inviteProfessor).not.toHaveBeenCalled();
  });
});
