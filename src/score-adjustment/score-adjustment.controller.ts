import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { User } from '../users/domain/user';
import { CreateScoreAdjustmentDto } from './dto/create-score-adjustment.dto';
import { ScoreAdjustmentResponseDto } from './dto/score-adjustment-response.dto';
import { ScoreAdjustmentService } from './score-adjustment.service';

@ApiTags('Score Adjustments')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'enrollments/:enrollmentId/score-adjustments', version: '1' })
export class ScoreAdjustmentController {
  constructor(private readonly scoreAdjustmentService: ScoreAdjustmentService) {}

  @Get()
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List score adjustments for an enrollment (Professor only)' })
  @ApiOkResponse({ type: [ScoreAdjustmentResponseDto] })
  async findAll(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
  ): Promise<ScoreAdjustmentResponseDto[]> {
    return this.scoreAdjustmentService.findByEnrollment(enrollmentId);
  }

  @Post()
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a score adjustment (Professor only)' })
  @ApiOkResponse({ type: ScoreAdjustmentResponseDto })
  async create(
    @CurrentUser() user: User,
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Body() dto: CreateScoreAdjustmentDto,
  ): Promise<ScoreAdjustmentResponseDto> {
    return this.scoreAdjustmentService.create(user.id, enrollmentId, dto);
  }

  @Delete(':scoreType')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a score adjustment (Professor only)' })
  async remove(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Param('scoreType') scoreType: 'cv_score' | 'ira' | 'final',
  ): Promise<void> {
    return this.scoreAdjustmentService.delete(enrollmentId, scoreType);
  }

  @Post('lock')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock all score adjustments for an enrollment (Professor only)' })
  async lock(@Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string): Promise<void> {
    return this.scoreAdjustmentService.lockAll(enrollmentId);
  }
}
