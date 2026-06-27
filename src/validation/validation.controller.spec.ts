import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { RolesGuard } from '../roles/roles.guard';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';

describe('ValidationController', () => {
  let controller: ValidationController;
  let service: ValidationService;

  const mockValidationService = {
    getCandidatesForDashboard: jest.fn(),
    getValidationStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidationController],
      providers: [
        {
          provide: ValidationService,
          useValue: mockValidationService,
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

    controller = module.get<ValidationController>(ValidationController);
    service = module.get<ValidationService>(ValidationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCandidates', () => {
    it('should call validationService.getCandidatesForDashboard', async () => {
      const mockResult = [{ id: '1' }];
      mockValidationService.getCandidatesForDashboard.mockResolvedValue(mockResult);

      const mockUser = { id: 'user-1', role: 'mdcc-secretary' } as any;
      const result = await controller.getCandidates(mockUser);

      expect(mockValidationService.getCandidatesForDashboard).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStats', () => {
    it('should call validationService.getValidationStats', async () => {
      const mockResult = { total: 10, validated: 5, pending: 3 };
      mockValidationService.getValidationStats.mockResolvedValue(mockResult);

      const result = await controller.getStats();

      expect(mockValidationService.getValidationStats).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
