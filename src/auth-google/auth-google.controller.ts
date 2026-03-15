import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
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
import { LoginResponseDto } from '../auth/dto/login-response.dto';

@ApiTags('Auth')
@Controller({ path: 'auth/google', version: '1' })
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
      'google',
      socialData,
    );

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return loginResponse;
  }
}
