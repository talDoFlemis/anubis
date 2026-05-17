import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

export interface SendInvitationParams {
  userId: string;
  email: string;
  currentTokenVersion: number;
  onboardingPath: string;
  emailBody?: string;
}

@Injectable()
export class InvitationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async sendInvitation(params: SendInvitationParams): Promise<void> {
    const nextTokenVersion = params.currentTokenVersion + 1;

    await this.usersService.update(params.userId, {
      confirmEmailTokenVersion: nextTokenVersion,
    });

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: params.userId,
        confirmEmailTokenVersion: nextTokenVersion,
      },
      {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
        expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_EXPIRES_IN'),
      },
    );

    const body = params.emailBody ?? this.composeDefaultBody(hash, params.onboardingPath);

    await this.mailService.send({
      to: params.email,
      title: 'Confirme seu email - Anubis',
      body,
    });
  }

  private composeDefaultBody(hash: string, onboardingPath: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}${onboardingPath}?hash=${hash}`;

    return `<p>Voce foi cadastrado(a) na plataforma do MDCC. Clique no link abaixo para concluir o seu cadastro:</p><p><a href="${confirmUrl}">Confirmar email</a></p>`;
  }
}
