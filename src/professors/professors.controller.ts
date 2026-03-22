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
import { InviteProfessorDto } from './dto/invite-professor.dto';
import { ProfessorsService } from './professors.service';

@ApiTags('Professors')
@Controller({ path: 'professors', version: '1' })
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @UseGuards(SessionAuthGuard, SessionLifecycleGuard, RolesGuard)
  @Roles(RoleEnum.mdccSecretary, RoleEnum.postGraduateCoordinator)
  @Post('invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Invite a professor with bootstrap credentials' })
  @ApiNoContentResponse({ description: 'Professor invited successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({
    description: 'Restricted session or insufficient role',
  })
  @ApiConflictResponse({ description: 'Email or CPF already exists' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async inviteProfessor(@Body() dto: InviteProfessorDto): Promise<void> {
    await this.professorsService.inviteProfessor(dto);
  }
}
