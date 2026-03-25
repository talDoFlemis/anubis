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
import { AuthService } from '../auth/auth.service';
import { LoginResponseDto } from '../auth-email/dto/login-response.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { User } from '../users/domain/user';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { buildLoginResponse } from 'src/auth/login-response.builder';

@ApiTags('Auth', 'Google Auth')
@Controller({ path: 'auth/provider/google', version: '1' })
export class AuthGoogleController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register using a Google ID token' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiConflictResponse({ description: 'Use your original provider' })
  @ApiUnauthorizedResponse({ description: 'Google email must be verified' })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Google ID token or unable to resolve a user',
  })
  login(
    @Body() _loginDto: AuthGoogleLoginDto,
    @CurrentUser() user: User,
  ): LoginResponseDto {
    return buildLoginResponse(user);
  }
}
