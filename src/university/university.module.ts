import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { RolesGuard } from '../roles/roles.guard';
import { CourseController } from './course.controller';
import { UniversityDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';
import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

@Module({
  imports: [UniversityDrizzlePersistenceModule],
  controllers: [UniversityController, CourseController],
  providers: [UniversityService, SessionAuthGuard, SessionLifecycleGuard, RolesGuard, Reflector],
  exports: [UniversityService],
})
export class UniversityModule {}
