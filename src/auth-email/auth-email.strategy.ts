import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthEmailService } from './auth-email.service';

@Injectable()
export class AuthEmailStrategy extends PassportStrategy(
  Strategy,
  'auth-email',
) {
  constructor(private readonly authEmailService: AuthEmailService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    const { user } = await this.authEmailService.validateLogin({
      email,
      password,
    });
    return user;
  }
}
