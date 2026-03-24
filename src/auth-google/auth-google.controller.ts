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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';
import { LoginResponseDto } from '../auth-email/dto/login-response.dto';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { User } from '../users/domain/user';

@ApiTags('Auth', 'Google Auth')
@Controller({ path: 'auth/provider/google', version: '1' })
export class AuthGoogleController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register using a Google ID token' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiUnprocessableEntityResponse({
    description:
      'Invalid Google ID token or unable to resolve a user from social data',
  })
  async login(
    @Body() loginDto: AuthGoogleLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const socialData = await this.authGoogleService.getProfileByToken(loginDto);
    const { user, loginResponse } = await this.authService.validateSocialLogin(
      AuthProvidersEnum.google,
      socialData,
    );

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return loginResponse;
  }

  @UseGuards(SessionAuthGuard, SessionLifecycleGuard)
  @Post('link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Explicitly link Google provider to current session',
  })
  @ApiOkResponse({ type: User, description: 'Google provider linked' })
  async link(
    @Body() loginDto: AuthGoogleLoginDto,
    @Req() req: Request,
  ): Promise<User> {
    const socialData = await this.authGoogleService.getProfileByToken(loginDto);
    return this.authService.linkGoogleProvider(req.session.userId!, socialData);
  }
}
