import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { RolesGuard } from '../roles/roles.guard';
import { ScoreAdjustmentDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';
import { ScoreAdjustmentController } from './score-adjustment.controller';
import { ScoreAdjustmentService } from './score-adjustment.service';

@Module({
  imports: [ScoreAdjustmentDrizzlePersistenceModule, EnrollmentModule],
  controllers: [ScoreAdjustmentController],
  providers: [
    ScoreAdjustmentService,
    SessionAuthGuard,
    SessionLifecycleGuard,
    RolesGuard,
    Reflector,
  ],
  exports: [ScoreAdjustmentService, ScoreAdjustmentDrizzlePersistenceModule],
})
export class ScoreAdjustmentModule {}
