import { Controller, Get, UseGuards } from '@nestjs/common';

import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { StaffOnly } from '../roles/roles.decorator';
import { User } from '../users/domain/user';

import { ValidationService } from './validation.service';

@ApiTags('Validation')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'validation', version: '1' })
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get('candidates')
  @StaffOnly()
  async getCandidates(@CurrentUser() user: User) {
    return this.validationService.getCandidatesForDashboard(user);
  }

  @Get('stats')
  @StaffOnly()
  async getStats() {
    return this.validationService.getValidationStats();
  }
}
