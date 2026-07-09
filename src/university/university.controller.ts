import {
  Body,
  Controller,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { CreateUniversityDto } from './dto/create-university.dto';
import { MergeEntitiesDto } from './dto/merge-entities.dto';
import { SearchUniversitiesDto } from './dto/search-universities.dto';
import { SetEntityStatusDto } from './dto/set-entity-status.dto';
import { SetUniversityGradeDto } from './dto/set-university-grade.dto';
import { UniversityDetailResponseDto, UniversityResponseDto } from './dto/university-response.dto';
import { UniversityService } from './university.service';

@ApiTags('Universities')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'universities', version: '1' })
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search universities by name or abbreviation' })
  @ApiOkResponse({ type: [UniversityResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async search(@Query() dto: SearchUniversitiesDto): Promise<UniversityResponseDto[]> {
    const results = await this.universityService.searchUniversities(dto.q, dto.limit);

    return results.map(u => ({
      id: u.id,
      label: u.abbreviation ? `${u.name} (${u.abbreviation})` : u.name,
    }));
  }

  @Get('pending')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List universities pending review (Professor only)' })
  @ApiOkResponse({ type: [UniversityDetailResponseDto] })
  async getPending(): Promise<UniversityDetailResponseDto[]> {
    return this.universityService.findPendingUniversities();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get university detail by ID' })
  @ApiOkResponse({ type: UniversityDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'University not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UniversityDetailResponseDto> {
    return this.universityService.findUniversityById(id);
  }

  @Post()
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manual university entry' })
  @ApiCreatedResponse({ type: UniversityDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Only candidates can create manual entries' })
  async create(@Body() dto: CreateUniversityDto): Promise<UniversityDetailResponseDto> {
    return this.universityService.createUniversity(dto);
  }

  @Patch(':id/grade')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set MEC grade for a university (Professor only)' })
  @ApiOkResponse({ type: UniversityDetailResponseDto })
  async setGrade(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetUniversityGradeDto,
  ): Promise<UniversityDetailResponseDto> {
    return this.universityService.setUniversityGrade(id, dto.mecGrade);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or invalidate a university (Professor only)' })
  @ApiOkResponse({ type: UniversityDetailResponseDto })
  async setStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetEntityStatusDto,
  ): Promise<UniversityDetailResponseDto> {
    return this.universityService.setUniversityStatus(id, dto.status);
  }

  @Get(':id/similar')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find similar universities for deduplication (Professor only)' })
  @ApiOkResponse({ type: [UniversityDetailResponseDto] })
  async getSimilar(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UniversityDetailResponseDto[]> {
    return this.universityService.findSimilarUniversities(id);
  }

  @Post(':id/merge')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge a source university into a target university (Professor only)' })
  async merge(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MergeEntitiesDto,
  ): Promise<void> {
    return this.universityService.mergeUniversities(id, dto.targetId);
  }
}
