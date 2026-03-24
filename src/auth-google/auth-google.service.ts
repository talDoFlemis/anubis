import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { SocialInterface } from '../social/interfaces/social.interface';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';

@Injectable()
export class AuthGoogleService {
  private google: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.google = new OAuth2Client(
      configService.getOrThrow('GOOGLE_CLIENT_ID'),
      configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
    );
  }

  async getProfileByToken(
    loginDto: AuthGoogleLoginDto,
  ): Promise<SocialInterface> {
    const ticket = await this.google.verifyIdToken({
      idToken: loginDto.idToken,
      audience: [this.configService.getOrThrow('GOOGLE_CLIENT_ID')],
    });

    const data = ticket.getPayload();

    if (!data) {
      throw new UnprocessableEntityException(
        'Falha ao verificar o token do Google.',
      );
    }

    return {
      id: data.sub,
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      verified_email: data.email_verified ?? false,
    };
  }
}
