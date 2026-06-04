import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { CandidateModule } from '../candidate/candidate.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { MailModule } from '../mail/mail.module';
import { ResearchThemeModule } from '../research-theme/research-theme.module';
import { RolesGuard } from '../roles/roles.guard';
import { UsersModule } from '../users/users.module';
import { EnrollmentPeriodController } from './enrollment-period.controller';
import { EnrollmentPeriodScheduler } from './enrollment-period.scheduler';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [
    UsersModule,
    CandidateModule,
    FileStorageModule,
    EnrollmentDrizzlePersistenceModule,
    ResearchThemeModule,
    MailModule,
  ],
  controllers: [EnrollmentPeriodController, EnrollmentController],
  providers: [
    EnrollmentPeriodService,
    EnrollmentService,
    EnrollmentPeriodScheduler,
    SessionAuthGuard,
    SessionLifecycleGuard,
    RolesGuard,
    Reflector,
  ],
  exports: [EnrollmentPeriodService, EnrollmentService],
})
export class EnrollmentModule {}
