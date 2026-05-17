import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { RolesGuard } from '../roles/roles.guard';
import type { User } from '../users/domain/user';
import { SecretaryController } from './secretary.controller';
import { SecretaryService } from './secretary.service';

describe('SecretaryController', () => {
  let controller: SecretaryController;
  let secretaryService: {
    invite: jest.Mock;
    disableAccount: jest.Mock;
    enableAccount: jest.Mock;
  };

  const coordinator = { id: 'coordinator-1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretaryController],
      providers: [
        {
          provide: SecretaryService,
          useValue: {
            invite: jest.fn(),
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

    controller = module.get(SecretaryController);
    secretaryService = module.get(SecretaryService);
  });

  it('calls invite on service', async () => {
    secretaryService.invite.mockResolvedValue({} as never);

    await controller.invite({
      name: 'Maria Silva',
      email: 'secretaria@ufc.br',
    });

    expect(secretaryService.invite).toHaveBeenCalledWith({
      name: 'Maria Silva',
      email: 'secretaria@ufc.br',
    });
  });

  it('calls disableAccount on service', async () => {
    secretaryService.disableAccount.mockResolvedValue({} as never);

    await controller.disableAccount('user-1', coordinator);

    expect(secretaryService.disableAccount).toHaveBeenCalledWith({
      secretaryId: 'user-1',
      actorUserId: 'coordinator-1',
    });
  });

  it('calls enableAccount on service', async () => {
    secretaryService.enableAccount.mockResolvedValue({} as never);

    await controller.enableAccount('user-1', coordinator);

    expect(secretaryService.enableAccount).toHaveBeenCalledWith({
      secretaryId: 'user-1',
      actorUserId: 'coordinator-1',
    });
  });
});
