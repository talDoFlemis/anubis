import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { RolesGuard } from '../roles/roles.guard';
import { UsersModule } from '../users/users.module';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { CandidateDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [UsersModule, CandidateDrizzlePersistenceModule],
  controllers: [CandidateController],
  providers: [
    CandidateService,
    SessionAuthGuard,
    SessionLifecycleGuard,
    RolesGuard,
    Reflector,
  ],
  exports: [CandidateService],
})
export class CandidateModule {}
