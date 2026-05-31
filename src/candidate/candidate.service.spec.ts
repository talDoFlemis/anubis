import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { buildPaginatedResult } from '../common/dto/paginated-response.dto';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';
import { CandidateService } from './candidate.service';
import type { CandidateProfile } from './domain/candidate-profile';
import { CandidateRepository } from './infrastructure/persistence/candidate.repository';

describe('CandidateService', () => {
  let service: CandidateService;
  let usersService: jest.Mocked<UsersService>;
  let candidateRepository: jest.Mocked<CandidateRepository>;
  const candidateProfile: CandidateProfile = {
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
            findProfileByUserId: jest.fn(),
            findAllByFilters: jest.fn(),
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
      ira: '8.75',
    });

    expect(usersService.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ onboardingCompleted: true }),
    );
    expect(candidateRepository.upsertByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ universityOfOrigin: 'UFRN', ira: '8.75' }),
    );
  });

  it('finds candidate profile by id', async () => {
    candidateRepository.findProfileByUserId.mockResolvedValue(candidateProfile);

    await expect(service.findOneById('user-1')).resolves.toEqual(candidateProfile);
  });

  it('throws when candidate profile is not found by id', async () => {
    candidateRepository.findProfileByUserId.mockResolvedValue(null);

    await expect(service.findOneById('user-1')).rejects.toThrow(NotFoundException);
  });

  it('finds current candidate profile for candidate user', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      role: RoleEnum.candidate,
    } as never);
    candidateRepository.findProfileByUserId.mockResolvedValue(candidateProfile);

    await expect(service.findMine('user-1')).resolves.toEqual(candidateProfile);
  });

  it('rejects findMine for non-candidate user', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      role: RoleEnum.professor,
    } as never);

    await expect(service.findMine('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('lists candidates using repository filters', async () => {
    candidateRepository.findAllByFilters.mockResolvedValue(
      buildPaginatedResult({
        data: [candidateProfile],
        page: 1,
        limit: 20,
        total: 1,
      }),
    );

    await expect(service.findAll({ universityOfOrigin: 'UFRN' })).resolves.toEqual(
      buildPaginatedResult({
        data: [candidateProfile],
        page: 1,
        limit: 20,
        total: 1,
      }),
    );
  });

  it('rejects invalid ira range filters', async () => {
    await expect(service.findAll({ iraMin: 9, iraMax: 8 })).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid poscomp range filters', async () => {
    await expect(service.findAll({ poscompMin: 800, poscompMax: 700 })).rejects.toThrow(
      BadRequestException,
    );
  });
});
