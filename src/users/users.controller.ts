import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { UserInviteDto } from './dto/user-invite.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SessionAuthGuard, SessionLifecycleGuard, RolesGuard)
  @Roles(RoleEnum.mdccSecretary, RoleEnum.postGraduateCoordinator)
  @Post('invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Invite a user' })
  @ApiNoContentResponse({ description: 'User invited successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({
    description: 'Restricted session or insufficient role',
  })
  @ApiConflictResponse({ description: 'Email or CPF already exists' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async invite(@Body() dto: UserInviteDto): Promise<void> {
    return this.usersService.invite(dto);
  }
}
