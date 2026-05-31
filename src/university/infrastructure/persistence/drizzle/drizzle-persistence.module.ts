import { Module } from '@nestjs/common';
import { UniversityRepository } from '../university.repository';
import { UniversityDrizzleRepository } from './university.drizzle-repository';

@Module({
  providers: [
    {
      provide: UniversityRepository,
      useClass: UniversityDrizzleRepository,
    },
  ],
  exports: [UniversityRepository],
})
export class UniversityDrizzlePersistenceModule {}
