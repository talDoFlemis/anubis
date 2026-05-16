import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { buildLoginResponse } from 'src/auth/login-response.builder';
import { User } from '../users/domain/user';
import { AuthEmailGuard } from './auth-email.guard';
import { AuthEmailService } from './auth-email.service';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthResendProfessorOnboardingDto } from './dto/auth-resend-professor-onboarding.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { CompleteProfessorOnboardingDto } from './dto/complete-professor-onboarding.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Auth', 'Email Auth')
@Controller({ path: 'auth/provider/email', version: '1' })
export class AuthEmailController {
  constructor(private readonly authEmailService: AuthEmailService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(AuthEmailGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiUnauthorizedResponse({
    description: 'Invalid email, password, or provider',
  })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  login(@Body() _dto: AuthEmailLoginDto, @Req() req: Request & { user: User }): LoginResponseDto {
    return buildLoginResponse(req.user);
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

  @Post('onboarding/professor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Complete professor onboarding by setting password' })
  @ApiNoContentResponse({ description: 'Professor onboarding completed' })
  @ApiBadRequestResponse({ description: 'Invalid or expired confirmation hash' })
  @ApiNotFoundResponse({ description: 'User associated with hash not found' })
  async completeProfessorOnboarding(@Body() dto: CompleteProfessorOnboardingDto): Promise<void> {
    await this.authEmailService.completeProfessorOnboarding(dto);
  }

  @Post('onboarding/professor/resend')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resend professor onboarding email' })
  @ApiNoContentResponse({ description: 'Request processed' })
  async resendProfessorOnboarding(@Body() dto: AuthResendProfessorOnboardingDto): Promise<void> {
    await this.authEmailService.resendProfessorOnboarding(dto);
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
}
