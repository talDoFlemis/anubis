import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { StaffOnly } from '../roles/roles.decorator';
import { CvScoringCategoryService } from './cv-scoring-category.service';
import { CopyScoringCategoriesDto } from './dto/copy-scoring-categories.dto';
import { CreateCvScoringCategoryDto } from './dto/create-cv-scoring-category.dto';
import { CvScoringCategoryResponseDto } from './dto/cv-scoring-category-response.dto';
import { UpdateCvScoringCategoryDto } from './dto/update-cv-scoring-category.dto';

@ApiTags('CV Scoring Categories')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ version: '1' })
export class CvScoringController {
  constructor(private readonly cvScoringCategoryService: CvScoringCategoryService) {}

  @Get('enrollment-periods/:periodId/scoring-categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List scoring categories for a period' })
  @ApiOkResponse({ type: [CvScoringCategoryResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiQuery({ name: 'level', required: false, enum: ['masters', 'doctoral'] })
  async findByPeriod(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Query('level') level?: string,
  ): Promise<CvScoringCategoryResponseDto[]> {
    if (level) {
      return this.cvScoringCategoryService.findByPeriodAndLevel(periodId, level);
    }
    return this.cvScoringCategoryService.findAllByPeriod(periodId);
  }

  @Post('enrollment-periods/:periodId/scoring-categories')
  @StaffOnly()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a scoring category for a period' })
  @ApiCreatedResponse({ type: CvScoringCategoryResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  create(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Body() dto: CreateCvScoringCategoryDto,
  ): Promise<CvScoringCategoryResponseDto> {
    return this.cvScoringCategoryService.create(periodId, dto);
  }

  @Patch('scoring-categories/:id')
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a scoring category' })
  @ApiOkResponse({ type: CvScoringCategoryResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Scoring category not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCvScoringCategoryDto,
  ): Promise<CvScoringCategoryResponseDto> {
    return this.cvScoringCategoryService.update(id, dto);
  }

  @Delete('scoring-categories/:id')
  @StaffOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a scoring category' })
  @ApiNoContentResponse({ description: 'Scoring category deleted' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Scoring category not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.cvScoringCategoryService.remove(id);
  }

  @Post('enrollment-periods/:periodId/scoring-categories/copy')
  @StaffOnly()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Copy scoring categories from another period' })
  @ApiCreatedResponse({ type: [CvScoringCategoryResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'No categories found in source period' })
  copyFromPeriod(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Body() dto: CopyScoringCategoriesDto,
  ): Promise<CvScoringCategoryResponseDto[]> {
    return this.cvScoringCategoryService.copyFromPeriod(dto.sourcePeriodId, periodId);
  }
}
