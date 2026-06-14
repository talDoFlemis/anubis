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
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import type { PaginatedResult } from '../common/dto/paginated-response.dto';
import { Roles, StaffOnly } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { User } from '../users/domain/user';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import { UpdateMastersDegreesDto } from './dto/masters-degree.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { UpdateEnrollmentThemesDto } from './dto/update-enrollment-themes.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentService } from './enrollment.service';

@ApiTags('Enrollments')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'enrollments', version: '1' })
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new enrollment' })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.create(user.id, dto);
  }

  @Get('me')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my enrollments' })
  @ApiOkResponse({ type: [EnrollmentResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findMine(@CurrentUser() user: User): Promise<EnrollmentResponseDto[]> {
    return this.enrollmentService.findMine(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an enrollment by id' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.findById(id);
  }

  @Get()
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all enrollments (staff only)' })
  @ApiOkResponse({ type: [EnrollmentResponseDto] })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findAll(@Query() filters: FindEnrollmentsDto): Promise<PaginatedResult<EnrollmentResponseDto>> {
    return this.enrollmentService.findAll(filters);
  }

  @Patch(':id')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an enrollment' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  update(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.update(user.id, id, dto);
  }

  @Post(':id/submit')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an enrollment' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  submit(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.submit(user.id, id);
  }

  @Patch(':id/status')
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update enrollment status (staff only)' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.updateStatus(id, dto);
  }

  @Put(':id/masters-degrees')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update master's degree info (doctoral only)" })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  updateMastersDegrees(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMastersDegreesDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.updateMastersDegrees(user.id, id, dto);
  }

  @Put(':id/themes')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update enrollment primary and secondary themes' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  updateThemes(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEnrollmentThemesDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.updateThemes(user.id, id, dto);
  }

  @Get(':id/masters-degrees')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get master's degree info for an enrollment" })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  getMastersDegrees(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.enrollmentService.getMastersDegrees(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel and delete a draft enrollment' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  cancel(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.enrollmentService.cancel(user.id, id);
  }

  @Post(':id/sigaa-receipt')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload SIGAA registration receipt' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  uploadSigaaReceipt(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.uploadSigaaReceipt(user.id, id, file);
  }

  @Get(':id/sigaa-receipt')
  @Roles(
    RoleEnum.candidate,
    RoleEnum.professor,
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get SIGAA receipt file URL' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  getSigaaReceipt(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ url: string; fileName: string }> {
    return this.enrollmentService.getSigaaReceiptUrl(user, id);
  }

  @Post(':id/poscomp-receipt')
  @Roles(RoleEnum.candidate)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload POSCOMP receipt' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  uploadPoscompReceipt(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.uploadPoscompReceipt(user.id, id, file);
  }

  @Get(':id/poscomp-receipt')
  @Roles(
    RoleEnum.candidate,
    RoleEnum.professor,
    RoleEnum.mdccSecretary,
    RoleEnum.postGraduateCoordinator,
    RoleEnum.postGraduateViceCoordinator,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get POSCOMP receipt file URL' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  getPoscompReceipt(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ url: string; fileName: string }> {
    return this.enrollmentService.getPoscompReceiptUrl(user, id);
  }
}
