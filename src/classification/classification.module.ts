import { CvScoringModule } from '@/cv-scoring/cv-scoring.module';
import { EnrollmentModule } from '@/enrollment/enrollment.module';
import { InterviewModule } from '@/interview/interview.module';
import { ResearchThemeModule } from '@/research-theme/research-theme.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';
import { ClassificationDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

import { ScoreAdjustmentModule } from '@/score-adjustment/score-adjustment.module';
import { UniversityModule } from '@/university/university.module';

@Module({
  imports: [
    UsersModule,
    EnrollmentModule,
    CvScoringModule,
    InterviewModule,
    ResearchThemeModule,
    ClassificationDrizzlePersistenceModule,
    UniversityModule,
    ScoreAdjustmentModule,
  ],
  providers: [ClassificationService],
  controllers: [ClassificationController],
  exports: [ClassificationService],
})
export class ClassificationModule {}
