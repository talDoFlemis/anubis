import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DrizzleDBHealthIndicator } from 'src/database/drizzle.health';
import { MailHealthIndicator } from 'src/mail/mail.health';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn() },
        },
        {
          provide: HttpHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
        {
          provide: DrizzleDBHealthIndicator,
          useValue: { isHealthy: jest.fn() },
        },
        {
          provide: MailHealthIndicator,
          useValue: { isHealthy: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
