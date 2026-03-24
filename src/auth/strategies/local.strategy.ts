import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthEmailService } from '../../auth-email/auth-email.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authEmailService: AuthEmailService) {
    super();
  }

  async validate(email: string, password: string) {
    const { user } = await this.authEmailService.validateLogin({
      email,
      password,
    });
    return user;
  }
}
