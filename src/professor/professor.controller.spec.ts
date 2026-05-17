import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { RolesGuard } from '../roles/roles.guard';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';

describe('ProfessorController', () => {
  let controller: ProfessorController;
  let professorService: ProfessorServiceMock;

  type ProfessorServiceMock = {
    invite: jest.Mock;
    findOne: jest.Mock;
    findAll: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    disableAccount: jest.Mock;
    enableAccount: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessorController],
      providers: [
        {
          provide: ProfessorService,
          useValue: {
            invite: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            disableAccount: jest.fn(),
            enableAccount: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(SessionLifecycleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(ProfessorController);
    professorService = module.get(ProfessorService);
  });

  it('calls invite on service', async () => {
    professorService.invite.mockResolvedValue({} as never);

    await controller.invite({
      email: 'prof@ufc.br',
      firstName: 'Maria',
      department: 'Departamento de Computacao',
      institution: 'UFC',
    });

    expect(professorService.invite).toHaveBeenCalled();
  });

  it('calls findOne on service', async () => {
    professorService.findOne.mockResolvedValue({} as never);

    await controller.findOne('user-1');

    expect(professorService.findOne).toHaveBeenCalledWith('user-1');
  });

  it('calls findByDepartment on service', async () => {
    professorService.findAll.mockResolvedValue([] as never);

    const filters = {
      page: 1,
      limit: 20,
    };
    await controller.findAll(filters);

    expect(professorService.findAll).toHaveBeenCalledWith(filters);
  });

  it('calls update on service', async () => {
    professorService.update.mockResolvedValue({} as never);

    await controller.update('user-1', { institution: 'UFC' });

    expect(professorService.update).toHaveBeenCalledWith('user-1', { institution: 'UFC' });
  });

  it('calls remove on service', async () => {
    professorService.remove.mockResolvedValue({} as never);

    await controller.remove('user-1');

    expect(professorService.remove).toHaveBeenCalledWith('user-1');
  });

  it('calls disableAccount on service', async () => {
    professorService.disableAccount.mockResolvedValue({} as never);

    await controller.disableAccount('user-1', { id: 'sec-1' } as never);

    expect(professorService.disableAccount).toHaveBeenCalledWith({
      professorId: 'user-1',
      actorUserId: 'sec-1',
    });
  });

  it('calls enableAccount on service', async () => {
    professorService.enableAccount.mockResolvedValue({} as never);

    await controller.enableAccount('user-1', { id: 'sec-1' } as never);

    expect(professorService.enableAccount).toHaveBeenCalledWith({
      professorId: 'user-1',
      actorUserId: 'sec-1',
    });
  });
});
