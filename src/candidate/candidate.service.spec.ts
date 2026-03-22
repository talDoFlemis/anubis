/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CandidateService } from './candidate.service';
import { UsersService } from '../users/users.service';
import { CandidateRepository } from './infrastructure/persistence/candidate.repository';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { getLoggerToken } from 'nestjs-pino';

describe('CandidateService', () => {
  let service: CandidateService;
  let usersService: jest.Mocked<UsersService>;
  let candidateRepository: jest.Mocked<CandidateRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateService,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByCpf: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CandidateRepository,
          useValue: {
            findByUserId: jest.fn(),
            upsertByUserId: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(CandidateService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CandidateService);
    usersService = module.get(UsersService);
    candidateRepository = module.get(CandidateRepository);
  });

  it('completes candidate onboarding and upserts candidate profile', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
    } as never);
    usersService.findByCpf.mockResolvedValue(null);

    await service.completeOnboarding('user-1', {
      firstName: 'John',
      lastName: 'Doe',
      cpf: '12345678901',
      universityOfOrigin: 'UFRN',
    });

    expect(usersService.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ onboardingCompleted: true }),
    );
    expect(candidateRepository.upsertByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ universityOfOrigin: 'UFRN' }),
    );
  });
});
