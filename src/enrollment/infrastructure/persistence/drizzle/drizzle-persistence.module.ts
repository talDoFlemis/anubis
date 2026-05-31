import { Module } from '@nestjs/common';
import { EnrollmentPeriodRepository } from '../enrollment-period.repository';
import { EnrollmentRepository } from '../enrollment.repository';
import { EnrollmentPeriodDrizzleRepository } from './enrollment-period.drizzle-repository';
import { EnrollmentDrizzleRepository } from './enrollment.drizzle-repository';

@Module({
  providers: [
    {
      provide: EnrollmentPeriodRepository,
      useClass: EnrollmentPeriodDrizzleRepository,
    },
    {
      provide: EnrollmentRepository,
      useClass: EnrollmentDrizzleRepository,
    },
  ],
  exports: [EnrollmentPeriodRepository, EnrollmentRepository],
})
export class EnrollmentDrizzlePersistenceModule {}
