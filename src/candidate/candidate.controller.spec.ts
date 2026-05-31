import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { buildPaginatedResult } from '../common/dto/paginated-response.dto';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { StatusEnum } from '../statuses/statuses.enum';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';

describe('CandidateController', () => {
  let controller: CandidateController;
  let candidateService: jest.Mocked<CandidateService>;

  const candidateProfile = {
    userId: 'user-1',
    email: 'candidate@example.com',
    cpf: '12345678901',
    firstName: 'Jane',
    lastName: 'Doe',
    role: RoleEnum.candidate,
    status: StatusEnum.active,
    onboardingCompleted: true,
    universityOfOrigin: 'UFRN',
    ira: '8.50',
    poscomp: 700,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateController],
      providers: [
        {
          provide: CandidateService,
          useValue: {
            findMine: jest.fn(),
            findOneById: jest.fn(),
            findAll: jest.fn(),
          },
        },
        Reflector,
        SessionAuthGuard,
        SessionLifecycleGuard,
        RolesGuard,
        {
          provide: getLoggerToken(SessionAuthGuard.name),
          useValue: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: getLoggerToken(SessionLifecycleGuard.name),
          useValue: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: getLoggerToken(RolesGuard.name),
          useValue: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(CandidateController);
    candidateService = module.get(CandidateService);
  });

  it('gets current candidate profile using current user id', async () => {
    candidateService.findMine.mockResolvedValue(candidateProfile);

    await expect(controller.getMine({ id: 'user-1' } as never)).resolves.toEqual(candidateProfile);
    expect(candidateService.findMine).toHaveBeenCalledWith('user-1');
  });

  it('gets one candidate by user id', async () => {
    candidateService.findOneById.mockResolvedValue(candidateProfile);

    await expect(controller.findOne('user-1')).resolves.toEqual(candidateProfile);
    expect(candidateService.findOneById).toHaveBeenCalledWith('user-1');
  });

  it('lists candidates using query filters', async () => {
    candidateService.findAll.mockResolvedValue(
      buildPaginatedResult({
        data: [candidateProfile],
        page: 1,
        limit: 20,
        total: 1,
      }),
    );

    await expect(controller.findAll({ universityOfOrigin: 'UFRN' })).resolves.toEqual(
      buildPaginatedResult({
        data: [candidateProfile],
        page: 1,
        limit: 20,
        total: 1,
      }),
    );
    expect(candidateService.findAll).toHaveBeenCalledWith({
      universityOfOrigin: 'UFRN',
    });
  });
});
