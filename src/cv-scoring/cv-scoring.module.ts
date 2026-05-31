import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { RolesGuard } from '../roles/roles.guard';
import { CvItemController } from './cv-item.controller';
import { CvItemService } from './cv-item.service';
import { CvScoringCategoryService } from './cv-scoring-category.service';
import { CvScoringController } from './cv-scoring.controller';
import { CvScoringService } from './cv-scoring.service';

@Module({
  imports: [FileStorageModule],
  controllers: [CvScoringController, CvItemController],
  providers: [
    CvScoringCategoryService,
    CvScoringService,
    CvItemService,
    SessionAuthGuard,
    SessionLifecycleGuard,
    RolesGuard,
    Reflector,
  ],
  exports: [CvScoringService, CvScoringCategoryService, CvItemService],
})
export class CvScoringModule {}
