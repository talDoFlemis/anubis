import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthGoogleService } from './auth-google.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthProvidersEnum } from 'src/auth/auth-providers.enum';

@Injectable()
export class GoogleIdTokenStrategy extends PassportStrategy(Strategy, 'google-id-token') {
  constructor(
    private readonly authGoogleService: AuthGoogleService,
    private readonly authService: AuthService,
  ) {
    super({ usernameField: 'idToken', passwordField: 'idToken' });
  }

  async validate(idToken: string) {
    const socialProfile = await this.authGoogleService.getProfileByToken({
      idToken,
    });

    const { user } = await this.authService.validateSocialLogin(
      AuthProvidersEnum.google,
      socialProfile,
    );

    return user;
  }
}
