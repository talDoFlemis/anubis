import { SessionAuthGuard } from '@/auth/guards/session-auth.guard';
import { Roles } from '@/roles/roles.decorator';
import { RoleEnum } from '@/roles/roles.enum';
import { RolesGuard } from '@/roles/roles.guard';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { TriggerClassificationDto } from './dto/trigger-classification.dto';

@Controller({ path: 'classification', version: '1' })
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Post('trigger')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  async triggerClassification(@Body() dto: TriggerClassificationDto) {
    return this.classificationService.triggerClassification(dto);
  }

  @Get('ranking')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  async getRanking(
    @Query('researchThemeId') researchThemeId?: string,
    @Query('stage') stage?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.classificationService.getRanking(
      {
        researchThemeId,
        stage: stage as 'mestrado' | 'doutorado' | undefined,
      },
      { page, limit },
    );
  }
}
