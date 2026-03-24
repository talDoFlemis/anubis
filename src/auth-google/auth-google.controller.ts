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
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { Session, SessionData } from 'express-session';
import { AuthService } from '../auth/auth.service';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { LoginResponseDto } from '../auth-email/dto/login-response.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { SocialInterface } from '../social/interfaces/social.interface';
import { User } from '../users/domain/user';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';

@ApiTags('Auth', 'Google Auth')
@Controller({ path: 'auth/provider/google', version: '1' })
export class AuthGoogleController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register using a Google ID token' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiConflictResponse({ description: 'Use your original provider' })
  @ApiUnauthorizedResponse({ description: 'Google email must be verified' })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Google ID token or unable to resolve a user',
  })
  async login(
    @Body() _loginDto: AuthGoogleLoginDto,
    @Req() req: Request & { user: SocialInterface },
  ): Promise<LoginResponseDto> {
    const { user, loginResponse } = await this.authService.validateSocialLogin(
      AuthProvidersEnum.google,
      req.user,
    );

    await this.regenerateSession(req);
    this.persistSessionSnapshot(req.session, user);

    return loginResponse;
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
