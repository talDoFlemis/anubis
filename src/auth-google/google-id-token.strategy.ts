import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthGoogleService } from './auth-google.service';

@Injectable()
export class GoogleIdTokenStrategy extends PassportStrategy(
  Strategy,
  'google-id-token',
) {
  constructor(private readonly authGoogleService: AuthGoogleService) {
    super({ usernameField: 'idToken', passwordField: 'idToken' });
  }

  async validate(idToken: string) {
    return this.authGoogleService.getProfileByToken({ idToken });
  }
}
