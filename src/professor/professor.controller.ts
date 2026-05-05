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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { ProfessorService } from './professor.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Professor } from './domain/professor';
import { StatusEnum } from '../statuses/statuses.enum';

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
  @ApiOperation({ summary: 'List professors by department' })
  @ApiOkResponse({ type: Professor, isArray: true })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  findByDepartment(@Query('department') department: string): Promise<Professor[]> {
    return this.professorService.findByDepartment(department);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a professor' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Professor not found' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.professorService.remove(id);
  }
}
