import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAIL_TRANSPORT,
  type MailTransport,
} from './interfaces/mail-transport.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    private readonly configService: ConfigService,
  ) {}

  async userSignUp(params: {
    to: string;
    data: { hash: string };
  }): Promise<void> {
    const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/confirm-email?hash=${params.data.hash}`;

    await this.transport.sendMail({
      to: params.to,
      subject: 'Confirm your email - Anubis',
      html: `
        <p>Hello,</p>
        <p>Please confirm your email by clicking the link below:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });
  }

  async forgotPassword(params: {
    to: string;
    data: { hash: string };
  }): Promise<void> {
    const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?hash=${params.data.hash}`;

    await this.transport.sendMail({
      to: params.to,
      subject: 'Reset your password - Anubis',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click the link below:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }

  async confirmNewEmail(params: {
    to: string;
    data: { hash: string };
  }): Promise<void> {
    const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/confirm-new-email?hash=${params.data.hash}`;

    await this.transport.sendMail({
      to: params.to,
      subject: 'Confirm your new email - Anubis',
      html: `
        <p>Hello,</p>
        <p>Please confirm your new email address by clicking the link below:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>If you did not request this change, please ignore this email.</p>
      `,
    });
  }
}
