import { RoleEnum } from '@/roles/roles.enum';
import { UsersService } from '@/users/users.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ResearchTheme } from './domain/research-theme';
import { ResearchThemeRepository } from './infrastructure/persistence/research-theme.repository';
import { ResearchThemeLevelEnum } from './research-theme-level.enum';
import { ResearchThemeService } from './research-theme.service';

describe('ResearchThemeService', () => {
  let service: ResearchThemeService;
  let usersService: jest.Mocked<UsersService>;
  let researchThemeRepository: jest.Mocked<ResearchThemeRepository>;

  const theme: ResearchTheme = {
    id: 'theme-1',
    professorId: 'prof-1',
    title: 'IA aplicada',
    description: 'Descricao do tema',
    vacancies: 2,
    level: ResearchThemeLevelEnum.masters,
    references: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchThemeService,
        {
          provide: ResearchThemeRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAllByFilters: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            hasEnrollments: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ResearchThemeService);
    usersService = module.get(UsersService);
    researchThemeRepository = module.get(ResearchThemeRepository);
  });

  it('creates research theme for professor', async () => {
    usersService.findById.mockResolvedValue({ id: 'prof-1', role: RoleEnum.professor } as never);
    researchThemeRepository.create.mockResolvedValue(theme);

    await expect(
      service.createForProfessor('prof-1', {
        title: 'IA aplicada',
        description: 'Descricao do tema',
        vacancies: 2,
        level: ResearchThemeLevelEnum.masters,
      }),
    ).resolves.toEqual(theme);
  });

  it('creates research theme on behalf of professor', async () => {
    usersService.findById.mockResolvedValue({ id: 'prof-1', role: RoleEnum.professor } as never);
    researchThemeRepository.create.mockResolvedValue(theme);

    await expect(
      service.createOnBehalf({
        professorId: 'prof-1',
        title: 'IA aplicada',
        description: 'Descricao do tema',
        vacancies: 2,
        level: ResearchThemeLevelEnum.masters,
      }),
    ).resolves.toEqual(theme);
  });

  it('rejects create when professor does not exist', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.createForProfessor('prof-1', {
        title: 'IA aplicada',
        description: 'Descricao',
        vacancies: 1,
        level: ResearchThemeLevelEnum.doctoral,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists themes using filters', async () => {
    researchThemeRepository.findAllByFilters.mockResolvedValue({
      data: [theme],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await expect(service.findAll({ level: ResearchThemeLevelEnum.masters })).resolves.toEqual({
      data: [theme],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('updates theme when actor is owner professor', async () => {
    researchThemeRepository.findById.mockResolvedValue(theme);
    researchThemeRepository.update.mockResolvedValue({ ...theme, title: 'Novo titulo' });

    await expect(
      service.update({
        id: 'theme-1',
        actorUserId: 'prof-1',
        actorRole: RoleEnum.professor,
        dto: { title: 'Novo titulo' },
      }),
    ).resolves.toEqual({ ...theme, title: 'Novo titulo' });
  });

  it('rejects update when actor is not owner', async () => {
    researchThemeRepository.findById.mockResolvedValue(theme);

    await expect(
      service.update({
        id: 'theme-1',
        actorUserId: 'prof-2',
        actorRole: RoleEnum.professor,
        dto: { title: 'Novo titulo' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows secretary update for any theme', async () => {
    researchThemeRepository.findById.mockResolvedValue(theme);
    researchThemeRepository.update.mockResolvedValue({ ...theme, title: 'Secretaria' });

    await expect(
      service.update({
        id: 'theme-1',
        actorUserId: 'sec-1',
        actorRole: RoleEnum.mdccSecretary,
        dto: { title: 'Secretaria' },
      }),
    ).resolves.toEqual({ ...theme, title: 'Secretaria' });
  });

  it('rejects delete when enrollments exist', async () => {
    researchThemeRepository.findById.mockResolvedValue(theme);
    researchThemeRepository.hasEnrollments.mockResolvedValue(true);

    await expect(
      service.remove({ id: 'theme-1', actorUserId: 'prof-1', actorRole: RoleEnum.professor }),
    ).rejects.toThrow(BadRequestException);
  });

  it('removes theme when allowed', async () => {
    researchThemeRepository.findById.mockResolvedValue(theme);
    researchThemeRepository.hasEnrollments.mockResolvedValue(false);

    await expect(
      service.remove({ id: 'theme-1', actorUserId: 'prof-1', actorRole: RoleEnum.professor }),
    ).resolves.toBeUndefined();

    expect(researchThemeRepository.remove.mock.calls).toEqual([['theme-1']]);
  });

  it('throws when theme not found', async () => {
    researchThemeRepository.findById.mockResolvedValue(null);

    await expect(service.findById('theme-1')).rejects.toThrow(NotFoundException);
  });
});
