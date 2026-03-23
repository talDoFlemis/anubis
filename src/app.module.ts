import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpLoggerMiddleware } from './common/middlewares/http-logger.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './env.validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthEmailModule } from './auth-email/auth-email.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { SessionModule } from './session/session.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { CandidateModule } from './candidate/candidate.module';
import { ProfessorsModule } from './professors/professors.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggingModule } from './common/logging.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggingModule,
    ThrottlerModule.forRoot([
      {
        // Default: 100 requests per minute per IP
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    UsersModule,
    CandidateModule,
    ProfessorsModule,
    AuthModule,
    AuthEmailModule,
    AuthGoogleModule,
    SessionModule,
    MailModule,
    HealthModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
