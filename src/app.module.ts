import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthEmailModule } from './auth-email/auth-email.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { ClassificationModule } from './classification/classification.module';
import { LoggingModule } from './common/logging.module';
import { HttpLoggerMiddleware } from './common/middlewares/http-logger.middleware';
import { CvScoringModule } from './cv-scoring/cv-scoring.module';
import { DatabaseModule } from './database/database.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { validate } from './env.validation';
import { HealthModule } from './health/health.module';
import { InterviewModule } from './interview/interview.module';
import { MailModule } from './mail/mail.module';
import { ProfessorModule } from './professor/professor.module';
import { ResearchThemeModule } from './research-theme/research-theme.module';
import { SecretaryModule } from './secretary/secretary.module';
import { SessionModule } from './session/session.module';
import { SystemModule } from './system/system.module';
import { UniversityModule } from './university/university.module';
import { UsersModule } from './users/users.module';
import { ValidationModule } from './validation/validation.module';

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
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    ProfessorModule,
    ResearchThemeModule,
    SecretaryModule,
    CandidateModule,
    UniversityModule,
    InterviewModule,
    ClassificationModule,
    AuthModule,
    AuthEmailModule,
    AuthGoogleModule,
    SessionModule,
    MailModule,
    HealthModule,
    SystemModule,
    EnrollmentModule,
    CvScoringModule,
    ValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
