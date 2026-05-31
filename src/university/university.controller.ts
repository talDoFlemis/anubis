import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { SearchUniversitiesDto } from './dto/search-universities.dto';
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
}
