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
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { User } from '../users/domain/user';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiBadRequestResponse({
    description:
      'Account registered via a social provider — use that provider to log in',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async login(
    @Body() loginDto: AuthEmailLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const { user, loginResponse } =
      await this.authService.validateLogin(loginDto);

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return loginResponse;
  }

  @Post('email/register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiNoContentResponse({
    description: 'Registration successful — confirmation email sent',
  })
  @ApiConflictResponse({ description: 'Email address is already registered' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async register(@Body() registerDto: AuthRegisterDto): Promise<void> {
    return this.authService.register(registerDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm email address using the hash from the confirmation email',
  })
  @ApiNoContentResponse({ description: 'Email confirmed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid or expired confirmation hash',
  })
  @ApiNotFoundResponse({
    description: 'User associated with the hash not found',
  })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.authService.confirmEmail(confirmEmailDto.hash);
  }

  @Post('email/confirm/new')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm a new email address change' })
  @ApiNoContentResponse({ description: 'New email confirmed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid or expired confirmation hash',
  })
  @ApiNotFoundResponse({
    description: 'User associated with the hash not found',
  })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async confirmNewEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.authService.confirmNewEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiNoContentResponse({
    description:
      'Request processed — if the email is registered a reset link will be sent',
  })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset password using the hash from the reset email',
  })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired reset hash' })
  @ApiNotFoundResponse({
    description: 'User associated with the hash not found',
  })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async resetPassword(
    @Body() resetPasswordDto: AuthResetPasswordDto,
  ): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @UseGuards(SessionAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: User, description: 'Current user profile' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async me(@Req() req: Request): Promise<User | null> {
    return this.authService.me(req.session.userId!);
  }

  @UseGuards(SessionAuthGuard)
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
  async update(
    @Req() req: Request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<User | null> {
    return this.authService.update(
      req.session.userId!,
      req.session.id,
      userDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Soft-delete the current account and destroy the session',
  })
  @ApiNoContentResponse({ description: 'Account deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async delete(@Req() req: Request): Promise<void> {
    await this.authService.softDelete(req.session.userId!);
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Destroy the current session (logout)' })
  @ApiNoContentResponse({ description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  async logout(@Req() req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  }
}
