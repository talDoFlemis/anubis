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
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { StatusEnum } from '../statuses/statuses.enum';
import { Professor } from './domain/professor';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { FindProfessorsDto } from './dto/find-professor.dto';
import { PaginatedProfessorResponseDto, ProfessorItemDto } from './dto/professor-response.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorService } from './professor.service';

@ApiTags('Professors')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'professors', version: '1' })
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a professor profile' })
  @ApiCreatedResponse()
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.mdccSecretary)
  async create(@Body() createProfessorDto: CreateProfessorDto) {
    const payload = {
      ...createProfessorDto,
      status: createProfessorDto.status ?? StatusEnum.inactive,
    };

    await this.professorService.create(payload);
    return;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a professor by user id' })
  @ApiOkResponse({ type: Professor })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Professor not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Professor> {
    return this.professorService.findOne(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List professors using optional filters' })
  @ApiOkResponse({ type: PaginatedProfessorResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findAll(@Query() filters: FindProfessorsDto): Promise<PaginatedResponseDto<ProfessorItemDto>> {
    return this.professorService.findAll(filters);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a professor' })
  @ApiOkResponse({ type: Professor })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Professor not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProfessorDto: UpdateProfessorDto,
  ): Promise<Professor> {
    return this.professorService.update(id, updateProfessorDto);
  }

  @Patch(':id/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a professor account' })
  @ApiOkResponse({ type: Professor })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Professor not found' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.mdccSecretary)
  disableAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<Professor> {
    return this.professorService.disableAccount({
      professorId: id,
      actorUserId: user.id,
    });
  }

  @Patch(':id/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a professor account' })
  @ApiOkResponse({ type: Professor })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Professor not found' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.mdccSecretary)
  enableAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<Professor> {
    return this.professorService.enableAccount({
      professorId: id,
      actorUserId: user.id,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a professor' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Professor not found' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.professorService.remove(id);
  }
}
