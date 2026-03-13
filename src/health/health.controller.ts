import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DrizzleDBHealthIndicator } from 'src/database/drizzle.health';
import { MailHealthIndicator } from 'src/mail/mail.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private drizzleDBHealthIndicator: DrizzleDBHealthIndicator,
    private mailHealthIndicator: MailHealthIndicator,
    @InjectPinoLogger(HealthController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    this.logger.debug('Starting healthcheck');
    return this.health.check([
      () => this.drizzleDBHealthIndicator.isHealthy('drizzle-db'),
      () => this.mailHealthIndicator.isHealthy('mail-transport'),
    ]);
  }
}
