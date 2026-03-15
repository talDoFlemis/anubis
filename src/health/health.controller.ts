import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import {
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiOkResponse } from '@nestjs/swagger';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DrizzleDBHealthIndicator } from 'src/database/drizzle.health';
import { MailHealthIndicator } from 'src/mail/mail.health';

@ApiTags('Health')
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
