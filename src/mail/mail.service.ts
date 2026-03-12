import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAIL_TRANSPORT,
  type MailTransport,
} from './interfaces/mail-transport.interface';

@Injectable()
export class MailService {
  private readonly confirmEmailTemplate: string;
  private readonly forgotPasswordTemplate: string;
  private readonly confirmNewEmailTemplate: string;

  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    private readonly configService: ConfigService,
  ) {
    this.confirmEmailTemplate = readFileSync(
      join(__dirname, 'confirm-email.template.html'),
      'utf-8',
    );
    this.forgotPasswordTemplate = readFileSync(
      join(__dirname, 'forgot-password.template.html'),
      'utf-8',
    );
    this.confirmNewEmailTemplate = readFileSync(
      join(__dirname, 'confirm-new-email.template.html'),
      'utf-8',
    );
  }

  async userSignUp(params: {
    to: string;
    data: { hash: string };
  }): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/confirm-email?hash=${params.data.hash}`;

    const html = this.confirmEmailTemplate.replaceAll(
      '{confirmEmailLink}',
      confirmUrl,
    );

    await this.transport.sendMail({
      to: params.to,
      subject: 'Confirme seu email - Anubis',
      html,
    });
  }

  async forgotPassword(params: {
    to: string;
    data: { hash: string };
  }): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?hash=${params.data.hash}`;

    const html = this.forgotPasswordTemplate.replaceAll(
      '{forgotPasswordLink}',
      resetUrl,
    );

    await this.transport.sendMail({
      to: params.to,
      subject: 'Redefina sua senha - Anubis',
      html,
    });
  }

  async confirmNewEmail(params: {
    to: string;
    data: { hash: string };
  }): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/confirm-new-email?hash=${params.data.hash}`;

    const html = this.confirmNewEmailTemplate.replaceAll(
      '{confirmNewEmailLink}',
      confirmUrl,
    );

    await this.transport.sendMail({
      to: params.to,
      subject: 'Confirme seu novo email - Anubis',
      html,
    });
  }
}
