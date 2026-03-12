import { Global, Module } from '@nestjs/common';
import { drizzleProvider } from './drizzle.provider';
import { DrizzleDBHealthIndicator } from './drizzle.health';
import { HealthIndicatorService } from '@nestjs/terminus';

@Global()
@Module({
  providers: [
    drizzleProvider,
    DrizzleDBHealthIndicator,
    HealthIndicatorService,
  ],
  exports: [drizzleProvider, DrizzleDBHealthIndicator],
})
export class DatabaseModule {}
