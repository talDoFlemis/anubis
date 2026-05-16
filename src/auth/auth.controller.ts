import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthUpdateDto } from '../auth-email/dto/auth-update.dto';
import { CompleteCandidateOnboardingDto } from '../candidate/dto/complete-candidate-onboarding.dto';
import { User } from '../users/domain/user';
import { AuthService } from './auth.service';
import { AllowRestrictedSession } from './decorators/allow-restricted-session.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { RestrictedSessionReason, SessionLifecycleGuard } from './guards/session-lifecycle.guard';

@ApiTags('Auth')
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AllowRestrictedSession(RestrictedSessionReason.onboardingIncomplete)
  @Post('onboarding/candidate')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Complete candidate onboarding requirements' })
  @ApiOkResponse({ type: User, description: 'Candidate onboarding completed' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiConflictResponse({ description: 'CPF already in use' })
  async completeCandidateOnboarding(
    @Req() req: Request,
    @Body() dto: CompleteCandidateOnboardingDto,
  ): Promise<User> {
    return this.authService.completeCandidateOnboarding(req.user!.id, dto);
  }

  @AllowRestrictedSession(
    RestrictedSessionReason.onboardingIncomplete,
    RestrictedSessionReason.mustChangePassword,
  )
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: User, description: 'Current user profile' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  me(@CurrentUser() user: User | null): User | null {
    return user;
  }

  @AllowRestrictedSession(RestrictedSessionReason.mustChangePassword)
  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update the current authenticated user' })
  @ApiOkResponse({ type: User, description: 'Updated user profile' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiBadRequestResponse({ description: 'Old password missing or incorrect' })
  @ApiConflictResponse({ description: 'New email address is already taken' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async update(@Req() req: Request, @Body() userDto: AuthUpdateDto): Promise<User | null> {
    return this.authService.update(req.user!.id, req.session.id, userDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Delete the current account and destroy the session',
  })
  @ApiNoContentResponse({ description: 'Account deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async delete(@Req() req: Request): Promise<void> {
    await this.authService.deleteUser(req.user!.id);
    await new Promise<void>((resolve, reject) => {
      req.session.destroy(err => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  }

  @AllowRestrictedSession(
    RestrictedSessionReason.onboardingIncomplete,
    RestrictedSessionReason.mustChangePassword,
  )
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Destroy the current session (logout)' })
  @ApiNoContentResponse({ description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async logout(@Req() req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy(err => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  }
}
