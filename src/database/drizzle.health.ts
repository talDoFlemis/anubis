import { Inject, Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from './drizzle.constants';
import type { DrizzleDB } from './drizzle.provider';

@Injectable()
export class DrizzleDBHealthIndicator {
  private readonly logger = new Logger(DrizzleDBHealthIndicator.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    let isHealthy = false;
    try {
      await this.db.execute(sql`SELECT 1`); // Simple query to check database connectivity
      isHealthy = true;
    } catch (error) {
      this.logger.error('Database health check failed', {
        errorMessage: error,
      });
    }

    if (!isHealthy) {
      return indicator.down();
    }

    return indicator.up();
  }
}
