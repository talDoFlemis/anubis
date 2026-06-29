import { Module } from '@nestjs/common';
import { ClassificationDrizzleRepository } from './classification.drizzle-repository';

@Module({
  providers: [ClassificationDrizzleRepository],
  exports: [ClassificationDrizzleRepository],
})
export class ClassificationDrizzlePersistenceModule {}
