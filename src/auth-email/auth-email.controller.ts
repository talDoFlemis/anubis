import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import type { Session, SessionData } from 'express-session';
import { AuthConfirmEmailDto } from '../auth/dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from '../auth/dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from '../auth/dto/auth-forgot-password.dto';
import { AuthLinkEmailProviderDto } from '../auth/dto/auth-link-email-provider.dto';
import { AuthRegisterDto } from '../auth/dto/auth-register.dto';
import { AuthResetPasswordDto } from '../auth/dto/auth-reset-password.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { User } from '../users/domain/user';
import { AuthEmailService } from './auth-email.service';
import { AllowRestrictedSession } from '../auth/decorators/allow-restricted-session.decorator';
import { RestrictedSessionReason } from '../auth/guards/session-lifecycle.guard';

@ApiTags('Auth', 'Email Auth')
@Controller({ path: 'auth/provider/email', version: '1' })
export class AuthEmailController {
  constructor(private readonly authEmailService: AuthEmailService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiBadRequestResponse({
    description:
      'Account registered via another provider — use that provider to log in',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async login(
    @Body() loginDto: AuthEmailLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const { user, loginResponse } =
      await this.authEmailService.validateLogin(loginDto);

    await this.regenerateSession(req);
    this.persistSessionSnapshot(req.session, user);

    return loginResponse;
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiNoContentResponse({
    description: 'Registration successful — confirmation email sent',
  })
  @ApiConflictResponse({ description: 'Email address is already registered' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async register(@Body() registerDto: AuthRegisterDto): Promise<void> {
    await this.authEmailService.register(registerDto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm email address using hash from e-mail link',
  })
  @ApiNoContentResponse({ description: 'Email confirmed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid or expired confirmation hash',
  })
  @ApiNotFoundResponse({ description: 'User associated with hash not found' })
  async confirmEmail(@Body() dto: AuthConfirmEmailDto): Promise<void> {
    await this.authEmailService.confirmEmail(dto);
  }

  @Post('confirm/new')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm new e-mail using hash from e-mail link' })
  @ApiNoContentResponse({ description: 'New email confirmed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid or expired confirmation hash',
  })
  @ApiNotFoundResponse({ description: 'User associated with hash not found' })
  async confirmNewEmail(@Body() dto: AuthConfirmEmailDto): Promise<void> {
    await this.authEmailService.confirmNewEmail(dto);
  }

  @Post('forgot/password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request password reset e-mail' })
  @ApiNoContentResponse({ description: 'Request processed' })
  async forgotPassword(@Body() dto: AuthForgotPasswordDto): Promise<void> {
    await this.authEmailService.forgotPassword(dto);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using hash from e-mail link' })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired reset hash' })
  @ApiNotFoundResponse({ description: 'User associated with hash not found' })
  async resetPassword(@Body() dto: AuthResetPasswordDto): Promise<void> {
    await this.authEmailService.resetPassword(dto);
  }

  @UseGuards(SessionAuthGuard, SessionLifecycleGuard)
  @AllowRestrictedSession(RestrictedSessionReason.onboardingIncomplete)
  @Post('link')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Explicitly link email/password provider with provider proof',
  })
  @ApiOkResponse({ type: User, description: 'Provider linked successfully' })
  @ApiConflictResponse({ description: 'Provider already linked' })
  async linkEmailProvider(
    @Req() req: Request,
    @Body() dto: AuthLinkEmailProviderDto,
  ): Promise<User> {
    return this.authEmailService.linkEmailProvider(
      req.session.userId!,
      req.session.id,
      dto,
    );
  }

  private async regenerateSession(req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  }

  private persistSessionSnapshot(
    session: Session & Partial<SessionData>,
    user: Pick<
      User,
      'id' | 'role' | 'status' | 'onboardingCompleted' | 'mustChangePassword'
    >,
  ): void {
    session.userId = user.id;
    session.userRole = user.role;
    session.role = user.role;
    session.status = user.status;
    session.onboardingCompleted = user.onboardingCompleted;
    session.mustChangePassword = user.mustChangePassword;
  }
}
