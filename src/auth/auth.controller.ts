import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/login')
  @ApiOkResponse({ type: LoginResponseDto })
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() registerDto: AuthRegisterDto): Promise<void> {
    return this.authService.register(registerDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.authService.confirmEmail(confirmEmailDto.hash);
  }

  @Post('email/confirm/new')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmNewEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.authService.confirmNewEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body() resetPasswordDto: AuthResetPasswordDto,
  ): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: Request) {
    return this.authService.me(req.session.userId!);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async update(@Req() req: Request, @Body() userDto: AuthUpdateDto) {
    return this.authService.update(
      req.session.userId!,
      req.session.id,
      userDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
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
  async logout(@Req() req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  }
}
