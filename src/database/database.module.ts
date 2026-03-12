import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { drizzleProvider } from './drizzle.provider';
import { drizzleTxProvider } from './drizzle-tx.provider';
import { DrizzleDBHealthIndicator } from './drizzle.health';
import { HealthIndicatorService } from '@nestjs/terminus';
import { TransactionMiddleware } from './transaction.middleware';

@Global()
@Module({
  providers: [
    drizzleProvider,
    drizzleTxProvider,
    DrizzleDBHealthIndicator,
    HealthIndicatorService,
  ],
  exports: [drizzleProvider, drizzleTxProvider, DrizzleDBHealthIndicator],
})
export class DatabaseModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TransactionMiddleware).forRoutes('*');
  }
}
