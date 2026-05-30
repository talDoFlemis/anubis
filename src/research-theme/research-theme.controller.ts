import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '@/auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '@/auth/guards/session-lifecycle.guard';
import { Roles } from '@/roles/roles.decorator';
import { RoleEnum } from '@/roles/roles.enum';
import { RolesGuard } from '@/roles/roles.guard';
import { User } from '@/users/domain/user';
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateResearchThemeOnBehalfDto } from './dto/create-research-theme-on-behalf.dto';
import { CreateResearchThemeDto } from './dto/create-research-theme.dto';
import { FindResearchThemesDto } from './dto/find-research-themes.dto';
import {
  PaginatedResearchThemeResponseDto,
  ResearchThemeResponseDto,
} from './dto/research-theme-response.dto';
import { UpdateResearchThemeDto } from './dto/update-research-theme.dto';
import { ResearchThemeService } from './research-theme.service';

@ApiTags('Research Themes')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'research-themes', version: '1' })
export class ResearchThemeController {
  constructor(private readonly researchThemeService: ResearchThemeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a research theme as professor' })
  @ApiCreatedResponse({ type: ResearchThemeResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.professor)
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateResearchThemeDto,
  ): Promise<ResearchThemeResponseDto> {
    return this.researchThemeService.createForProfessor(user.id, dto);
  }

  @Post('on-behalf')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a research theme on behalf of a professor' })
  @ApiCreatedResponse({ type: ResearchThemeResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @UseGuards(RolesGuard)
  @Roles(
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  createOnBehalf(@Body() dto: CreateResearchThemeOnBehalfDto): Promise<ResearchThemeResponseDto> {
    return this.researchThemeService.createOnBehalf(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a research theme by id' })
  @ApiOkResponse({ type: ResearchThemeResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Research theme not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ResearchThemeResponseDto> {
    return this.researchThemeService.findById(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List research themes using optional filters' })
  @ApiOkResponse({ type: PaginatedResearchThemeResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  findAll(@Query() filters: FindResearchThemesDto): Promise<PaginatedResearchThemeResponseDto> {
    return this.researchThemeService.findAll(filters);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a research theme' })
  @ApiOkResponse({ type: ResearchThemeResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Research theme not found' })
  @UseGuards(RolesGuard)
  @Roles(
    RoleEnum.professor,
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateResearchThemeDto,
  ): Promise<ResearchThemeResponseDto> {
    return this.researchThemeService.update({
      id,
      actorUserId: user.id,
      actorRole: user.role,
      dto,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a research theme' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Research theme not found' })
  @UseGuards(RolesGuard)
  @Roles(
    RoleEnum.professor,
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User): Promise<void> {
    return this.researchThemeService.remove({
      id,
      actorUserId: user.id,
      actorRole: user.role,
    });
  }
}
