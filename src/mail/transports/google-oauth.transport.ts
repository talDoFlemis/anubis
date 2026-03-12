import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import type { MailTransport } from '../interfaces/mail-transport.interface';

@Injectable()
export class GoogleOauthTransport implements MailTransport {
  constructor(private readonly configService: ConfigService) {}

  private async createTransporter(): Promise<nodemailer.Transporter> {
    const clientId = this.configService.getOrThrow('MAIL_GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow(
      'MAIL_GOOGLE_CLIENT_SECRET',
    );
    const refreshToken = this.configService.getOrThrow(
      'MAIL_GOOGLE_REFRESH_TOKEN',
    );
    const user = this.configService.getOrThrow('MAIL_GOOGLE_USER');

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { token } = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: token ?? undefined,
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const transporter = await this.createTransporter();
    const from = this.configService.getOrThrow('MAIL_DEFAULT_FROM');

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
