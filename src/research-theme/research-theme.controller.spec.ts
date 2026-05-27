import { SessionAuthGuard } from '@/auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '@/auth/guards/session-lifecycle.guard';
import { buildPaginatedResult } from '@/common/dto/paginated-response.dto';
import { RoleEnum } from '@/roles/roles.enum';
import { RolesGuard } from '@/roles/roles.guard';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { ResearchThemeLevelEnum } from './research-theme-level.enum';
import { ResearchThemeController } from './research-theme.controller';
import { ResearchThemeService } from './research-theme.service';

describe('ResearchThemeController', () => {
  let controller: ResearchThemeController;
  let service: jest.Mocked<ResearchThemeService>;

  const theme = {
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
      controllers: [ResearchThemeController],
      providers: [
        {
          provide: ResearchThemeService,
          useValue: {
            createForProfessor: jest.fn(),
            createOnBehalf: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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

    controller = module.get(ResearchThemeController);
    service = module.get(ResearchThemeService);
  });

  it('creates theme for current professor', async () => {
    service.createForProfessor.mockResolvedValue(theme);
    const createSpy = jest.spyOn(service, 'createForProfessor');

    await expect(
      controller.create({ id: 'prof-1' } as never, {
        title: 'IA aplicada',
        description: 'Descricao do tema',
        vacancies: 2,
        level: ResearchThemeLevelEnum.masters,
      }),
    ).resolves.toEqual(theme);

    expect(createSpy).toHaveBeenCalledWith('prof-1', {
      title: 'IA aplicada',
      description: 'Descricao do tema',
      vacancies: 2,
      level: ResearchThemeLevelEnum.masters,
    });
  });

  it('creates theme on behalf of professor', async () => {
    service.createOnBehalf.mockResolvedValue(theme);

    await expect(
      controller.createOnBehalf({
        professorId: 'prof-1',
        title: 'IA aplicada',
        description: 'Descricao do tema',
        vacancies: 2,
        level: ResearchThemeLevelEnum.masters,
      }),
    ).resolves.toEqual(theme);
  });

  it('fetches theme by id', async () => {
    service.findById.mockResolvedValue(theme);
    const findSpy = jest.spyOn(service, 'findById');

    await expect(controller.findOne('theme-1')).resolves.toEqual(theme);
    expect(findSpy).toHaveBeenCalledWith('theme-1');
  });

  it('lists themes by filters', async () => {
    service.findAll.mockResolvedValue(
      buildPaginatedResult({
        data: [theme],
        page: 1,
        limit: 20,
        total: 1,
      }),
    );

    await expect(controller.findAll({ level: ResearchThemeLevelEnum.masters })).resolves.toEqual(
      buildPaginatedResult({
        data: [theme],
        page: 1,
        limit: 20,
        total: 1,
      }),
    );
  });

  it('updates theme using actor context', async () => {
    service.update.mockResolvedValue(theme);
    const updateSpy = jest.spyOn(service, 'update');

    await expect(
      controller.update('theme-1', { id: 'prof-1', role: RoleEnum.professor } as never, {
        title: 'Novo',
      }),
    ).resolves.toEqual(theme);

    expect(updateSpy).toHaveBeenCalledWith({
      id: 'theme-1',
      actorUserId: 'prof-1',
      actorRole: RoleEnum.professor,
      dto: { title: 'Novo' },
    });
  });

  it('removes theme using actor context', async () => {
    service.remove.mockResolvedValue();
    const removeSpy = jest.spyOn(service, 'remove');

    await expect(
      controller.remove('theme-1', { id: 'prof-1', role: RoleEnum.professor } as never),
    ).resolves.toBeUndefined();

    expect(removeSpy).toHaveBeenCalledWith({
      id: 'theme-1',
      actorUserId: 'prof-1',
      actorRole: RoleEnum.professor,
    });
  });
});
