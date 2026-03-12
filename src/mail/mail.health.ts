import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  MAIL_TRANSPORT,
  type MailTransport,
} from './interfaces/mail-transport.interface';

@Injectable()
export class MailHealthIndicator extends HealthIndicatorService {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
  ) {
    super();
  }

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
