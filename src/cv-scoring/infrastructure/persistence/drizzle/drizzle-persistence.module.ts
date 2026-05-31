import { Module } from '@nestjs/common';
import { CvItemRepository } from '../cv-item.repository';
import { CvScoringCategoryRepository } from '../cv-scoring-category.repository';
import { CvScoringRepository } from '../cv-scoring.repository';
import { CvItemDrizzleRepository } from './cv-item.drizzle-repository';
import { CvScoringCategoryDrizzleRepository } from './cv-scoring-category.drizzle-repository';
import { CvScoringDrizzleRepository } from './cv-scoring.drizzle-repository';

@Module({
  providers: [
    {
      provide: CvScoringRepository,
      useClass: CvScoringDrizzleRepository,
    },
    {
      provide: CvScoringCategoryRepository,
      useClass: CvScoringCategoryDrizzleRepository,
    },
    {
      provide: CvItemRepository,
      useClass: CvItemDrizzleRepository,
    },
  ],
  exports: [CvScoringRepository, CvScoringCategoryRepository, CvItemRepository],
})
export class CvScoringDrizzlePersistenceModule {}
