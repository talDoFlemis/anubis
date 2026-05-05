import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';
import { ProfessorService } from './professor.service';
import { UsersService } from '../users/users.service';
import { ProfessorRepository } from './infraestructure/persistence/professor.repository';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import type { Professor } from './domain/professor';

describe('ProfessorService', () => {
  let service: ProfessorService;
  let usersService: jest.Mocked<UsersService>;
  let professorRepository: jest.Mocked<ProfessorRepository>;

  const professor: Professor = {
    id: 'user-1',
    authProvider: AuthProvidersEnum.email,
    providerSubject: null,
    email: 'prof@ufc.br',
    password: null,
    cpf: '12345678901',
    firstName: 'Maria',
    lastName: 'Silva',
    role: RoleEnum.professor,
    status: StatusEnum.active,
    onboardingCompleted: true,
    mustChangePassword: false,
    bootstrapPasswordExpiresAt: null,
    confirmEmailTokenVersion: 0,
    forgotPasswordTokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
    department: 'Departamento de Computacao',
    institution: 'UFC',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByCpf: jest.fn(),
          },
        },
        {
          provide: ProfessorRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByDepartment: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(ProfessorService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProfessorService);
    usersService = module.get(UsersService);
    professorRepository = module.get(ProfessorRepository);
  });

  it('creates professor when unique constraints pass', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    professorRepository.create.mockResolvedValue(professor);

    await expect(
      service.create({
        email: 'prof@ufc.br',
        department: 'Departamento de Computacao',
        institution: 'UFC',
      }),
    ).resolves.toEqual(professor);
  });

  it('rejects duplicate email on create', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'other' } as never);

    await expect(
      service.create({
        email: 'prof@ufc.br',
        department: 'Departamento de Computacao',
        institution: 'UFC',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects password with non-email provider on create', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);

    await expect(
      service.create({
        email: 'prof@ufc.br',
        password: 'Senha@1234',
        authProvider: AuthProvidersEnum.google,
        department: 'Departamento de Computacao',
        institution: 'UFC',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('finds professor by id', async () => {
    professorRepository.findById.mockResolvedValue(professor);

    await expect(service.findOne('user-1')).resolves.toEqual(professor);
  });

  it('throws when professor is not found by id', async () => {
    professorRepository.findById.mockResolvedValue(null);

    await expect(service.findOne('user-1')).rejects.toThrow(NotFoundException);
  });

  it('updates professor when unique constraints pass', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    professorRepository.update.mockResolvedValue(professor);

    await expect(
      service.update('user-1', {
        email: 'prof@ufc.br',
        department: 'Departamento de Computacao',
      }),
    ).resolves.toEqual(professor);
  });

  it('rejects duplicate email on update', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'other' } as never);

    await expect(
      service.update('user-1', {
        email: 'prof@ufc.br',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects password with non-email provider on update', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);

    await expect(
      service.update('user-1', {
        password: 'Senha@1234',
        authProvider: AuthProvidersEnum.google,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('removes professor when found', async () => {
    professorRepository.findById.mockResolvedValue(professor);
    professorRepository.remove.mockResolvedValue();

    await expect(service.remove('user-1')).resolves.toBeUndefined();
  });

  it('throws when removing missing professor', async () => {
    professorRepository.findById.mockResolvedValue(null);

    await expect(service.remove('user-1')).rejects.toThrow(NotFoundException);
  });
});
