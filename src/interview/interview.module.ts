import { Module } from '@nestjs/common';

import { InterviewService } from './interview.service';

import { InterviewController } from './interview.controller';

import { InterviewDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

import { UsersModule } from '@/users/users.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';

@Module({
  imports: [UsersModule, InterviewDrizzlePersistenceModule, EnrollmentModule],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
