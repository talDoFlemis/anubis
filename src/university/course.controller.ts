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
import { CourseDetailResponseDto, CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { MergeEntitiesDto } from './dto/merge-entities.dto';
import { SearchCoursesDto } from './dto/search-courses.dto';
import { SetEntityStatusDto } from './dto/set-entity-status.dto';
import { UniversityService } from './university.service';

@ApiTags('Courses')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'courses', version: '1' })
export class CourseController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search courses by name with optional university filter' })
  @ApiOkResponse({ type: [CourseResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async search(@Query() dto: SearchCoursesDto): Promise<CourseResponseDto[]> {
    const results = await this.universityService.searchCourses(dto.q, dto.universityId, dto.limit);

    return results.map(c => ({
      id: c.id,
      label: c.name,
    }));
  }

  @Get('pending')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List courses pending review (Professor only)' })
  @ApiOkResponse({ type: [CourseDetailResponseDto] })
  async getPending(): Promise<CourseDetailResponseDto[]> {
    return this.universityService.findPendingCourses();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get course detail by ID' })
  @ApiOkResponse({ type: CourseDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<CourseDetailResponseDto> {
    return this.universityService.findCourseById(id);
  }

  @Post()
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manual course entry' })
  @ApiCreatedResponse({ type: CourseDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Only candidates can create manual entries' })
  async create(@Body() dto: CreateCourseDto): Promise<CourseDetailResponseDto> {
    return this.universityService.createCourse(dto);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or invalidate a course (Professor only)' })
  @ApiOkResponse({ type: CourseDetailResponseDto })
  async setStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetEntityStatusDto,
  ): Promise<CourseDetailResponseDto> {
    return this.universityService.setCourseStatus(id, dto.status);
  }

  @Get(':id/similar')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find similar courses for deduplication (Professor only)' })
  @ApiOkResponse({ type: [CourseDetailResponseDto] })
  async getSimilar(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CourseDetailResponseDto[]> {
    return this.universityService.findSimilarCourses(id);
  }

  @Post(':id/merge')
  @Roles(RoleEnum.professor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge a source course into a target course (Professor only)' })
  async merge(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MergeEntitiesDto,
  ): Promise<void> {
    return this.universityService.mergeCourses(id, dto.targetId);
  }
}
