import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
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
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { User } from '../users/domain/user';
import { InviteSecretaryDto } from './dto/invite-secretary.dto';
import { SecretaryService } from './secretary.service';

@ApiTags('Secretaries')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'secretaries', version: '1' })
export class SecretaryController {
  constructor(private readonly secretaryService: SecretaryService) {}

  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a new secretary' })
  @ApiCreatedResponse({ description: 'Secretary invitation sent successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiConflictResponse({ description: 'Email already registered' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.postGraduateCoordinator)
  async invite(@Body() inviteSecretaryDto: InviteSecretaryDto): Promise<void> {
    await this.secretaryService.invite(inviteSecretaryDto);
  }

  @Patch(':id/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a secretary account' })
  @ApiOkResponse({ description: 'Secretary account disabled' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Secretary not found' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.postGraduateCoordinator)
  async disableAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.secretaryService.disableAccount({
      secretaryId: id,
      actorUserId: user.id,
    });
  }

  @Patch(':id/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a secretary account' })
  @ApiOkResponse({ description: 'Secretary account enabled' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Secretary not found' })
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.postGraduateCoordinator)
  async enableAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.secretaryService.enableAccount({
      secretaryId: id,
      actorUserId: user.id,
    });
  }
}
