import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CandidateService } from './candidate.service';
import { CandidateDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [UsersModule, CandidateDrizzlePersistenceModule],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
