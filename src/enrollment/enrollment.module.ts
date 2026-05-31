import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { CandidateModule } from '../candidate/candidate.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { RolesGuard } from '../roles/roles.guard';
import { UsersModule } from '../users/users.module';
import { EnrollmentPeriodController } from './enrollment-period.controller';
import { EnrollmentPeriodScheduler } from './enrollment-period.scheduler';
import { EnrollmentPeriodService } from './enrollment-period.service';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';

@Module({
  imports: [UsersModule, CandidateModule, FileStorageModule],
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
