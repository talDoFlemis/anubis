import { Controller, Get, Logger } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DrizzleDBHealthIndicator } from 'src/database/drizzle.health';
import { MailHealthIndicator } from 'src/mail/mail.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  constructor(
    private health: HealthCheckService,
    private drizzleDBHealthIndicator: DrizzleDBHealthIndicator,
    private mailHealthIndicator: MailHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check the health of all service dependencies' })
  @ApiOkResponse({ description: 'All health indicators are up' })
  @ApiServiceUnavailableResponse({
    description: 'One or more health indicators are down',
  })
  check() {
    this.logger.debug('Starting healthcheck');
    return this.health.check([
      () => this.drizzleDBHealthIndicator.isHealthy('drizzle-db'),
      () => this.mailHealthIndicator.isHealthy('mail-transport'),
    ]);
  }
}
