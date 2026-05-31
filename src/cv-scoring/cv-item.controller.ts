import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { FileStorageService } from '../file-storage/file-storage.service';
import { User } from '../users/domain/user';
import { CvItemService } from './cv-item.service';
import { CreateCvItemDto } from './dto/create-cv-item.dto';
import { CvItemResponseDto } from './dto/cv-item-response.dto';
import { UpdateCvItemDto } from './dto/update-cv-item.dto';

@ApiTags('CV Items')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'enrollments/:enrollmentId/cv-items', version: '1' })
export class CvItemController {
  constructor(
    private readonly cvItemService: CvItemService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a CV item to an enrollment' })
  @ApiCreatedResponse({ type: CvItemResponseDto })
  create(
    @CurrentUser() user: User,
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Body() dto: CreateCvItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CvItemResponseDto> {
    return this.cvItemService.create(user.id, enrollmentId, dto, file);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List CV items for an enrollment' })
  @ApiOkResponse({ type: [CvItemResponseDto] })
  findAll(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
  ): Promise<CvItemResponseDto[]> {
    return this.cvItemService.findByEnrollment(enrollmentId);
  }

  @Get(':itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a CV item by ID' })
  @ApiOkResponse({ type: CvItemResponseDto })
  findOne(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<CvItemResponseDto> {
    return this.cvItemService.findById(enrollmentId, itemId);
  }

  @Patch(':itemId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a CV item' })
  @ApiOkResponse({ type: CvItemResponseDto })
  update(
    @CurrentUser() user: User,
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateCvItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CvItemResponseDto> {
    return this.cvItemService.update(user.id, enrollmentId, itemId, dto, file);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a CV item' })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: User,
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    await this.cvItemService.remove(user.id, enrollmentId, itemId);
  }

  @Get(':itemId/file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get presigned URL for CV item proof file' })
  async getFileUrl(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<{ url: string }> {
    const item = await this.cvItemService.findById(enrollmentId, itemId);
    if (!item.proofFileId) {
      throw new NotFoundException('Este item não possui arquivo de comprovação.');
    }
    const url = await this.fileStorageService.getSignedDownloadUrl(item.proofFileId);
    return { url };
  }
}
