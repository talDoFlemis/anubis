import { Module } from '@nestjs/common';

import { InterviewDrizzleRepository } from './interview.drizzle-repository';

import { INTERVIEW_REPOSITORY } from '../../../interview.constants';

import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: INTERVIEW_REPOSITORY,
      useClass: InterviewDrizzleRepository,
    },
  ],
  exports: [INTERVIEW_REPOSITORY],
})
export class InterviewDrizzlePersistenceModule {}
