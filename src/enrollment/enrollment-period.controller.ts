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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { StaffOnly } from '../roles/roles.decorator';
import { CreateEnrollmentPeriodDto } from './dto/create-enrollment-period.dto';
import { EnrollmentPeriodResponseDto } from './dto/enrollment-period-response.dto';
import { UpdateEnrollmentPeriodDto } from './dto/update-enrollment-period.dto';
import { EnrollmentPeriodService } from './enrollment-period.service';

@ApiTags('Enrollment Periods')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'enrollment-periods', version: '1' })
export class EnrollmentPeriodController {
  constructor(private readonly enrollmentPeriodService: EnrollmentPeriodService) {}

  @Post()
  @StaffOnly()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new enrollment period' })
  @ApiCreatedResponse({ type: EnrollmentPeriodResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  create(@Body() dto: CreateEnrollmentPeriodDto): Promise<EnrollmentPeriodResponseDto> {
    return this.enrollmentPeriodService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all enrollment periods' })
  @ApiOkResponse({ type: [EnrollmentPeriodResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  findAll(): Promise<EnrollmentPeriodResponseDto[]> {
    return this.enrollmentPeriodService.findAll();
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get currently open enrollment periods' })
  @ApiOkResponse({ type: [EnrollmentPeriodResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  findActive(): Promise<EnrollmentPeriodResponseDto[]> {
    return this.enrollmentPeriodService.findCurrentOpen();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an enrollment period by id' })
  @ApiOkResponse({ type: EnrollmentPeriodResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Enrollment period not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<EnrollmentPeriodResponseDto> {
    return this.enrollmentPeriodService.findById(id);
  }

  @Patch(':id')
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an enrollment period' })
  @ApiOkResponse({ type: EnrollmentPeriodResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment period not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEnrollmentPeriodDto,
  ): Promise<EnrollmentPeriodResponseDto> {
    return this.enrollmentPeriodService.update(id, dto);
  }

  @Post(':id/close')
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually close an enrollment period' })
  @ApiOkResponse({ type: EnrollmentPeriodResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment period not found' })
  close(@Param('id', new ParseUUIDPipe()) id: string): Promise<EnrollmentPeriodResponseDto> {
    return this.enrollmentPeriodService.close(id);
  }

  @Delete(':id')
  @StaffOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an enrollment period' })
  @ApiNoContentResponse({ description: 'Enrollment period deleted' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment period not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.enrollmentPeriodService.remove(id);
  }
}
