import { Module } from '@nestjs/common';
import { ScoreAdjustmentRepository } from '../score-adjustment.repository';
import { ScoreAdjustmentDrizzleRepository } from './score-adjustment.drizzle-repository';

@Module({
  providers: [
    {
      provide: ScoreAdjustmentRepository,
      useClass: ScoreAdjustmentDrizzleRepository,
    },
  ],
  exports: [ScoreAdjustmentRepository],
})
export class ScoreAdjustmentDrizzlePersistenceModule {}
