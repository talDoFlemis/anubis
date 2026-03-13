import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { DrizzleDB } from './drizzle.provider';
import { DRIZZLE } from './drizzle.constants';
import { sql } from 'drizzle-orm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class DrizzleDBHealthIndicator extends HealthIndicatorService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectPinoLogger(DrizzleDBHealthIndicator.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    let isHealthy = false;
    try {
      await this.db.execute(sql`SELECT 1`); // Simple query to check database connectivity
      isHealthy = true;
    } catch (error) {
      this.logger.error('Database health check failed', {
        errorMessage: error as unknown,
      });
    }

    if (!isHealthy) {
      return indicator.down();
    }

    return indicator.up();
  }
}
