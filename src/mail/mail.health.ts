import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import {
  MAIL_TRANSPORT,
  type MailTransport,
} from './interfaces/mail-transport.interface';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class MailHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectPinoLogger(MailHealthIndicator.name)
    private readonly logger: PinoLogger,
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    let isHealthy = false;
    try {
      isHealthy = await this.transport.verify();
    } catch (error) {
      this.logger.error('Mail Transport health check failed', {
        errorMessage: error as unknown,
      });
    }

    if (!isHealthy) {
      return indicator.down();
    }

    return indicator.up();
  }
}
