import { Module } from '@nestjs/common';
import { CandidateRepository } from '../candidate.repository';
import { CandidateDrizzleRepository } from './candidate.drizzle-repository';

@Module({
  providers: [
    {
      provide: CandidateRepository,
      useClass: CandidateDrizzleRepository,
    },
  ],
  exports: [CandidateRepository],
})
export class CandidateDrizzlePersistenceModule {}
