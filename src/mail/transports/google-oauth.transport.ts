import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import type { MailTransport } from '../interfaces/mail-transport.interface';

// Refresh the access token this many milliseconds before it expires
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class GoogleOauthTransport implements MailTransport, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  private cachedTransporter: nodemailer.Transporter | null = null;
  private tokenExpiresAt: number = 0;

  private isTokenExpired(): boolean {
    return Date.now() >= this.tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS;
  }

  private async buildTransporter(): Promise<nodemailer.Transporter> {
    const clientId = this.configService.getOrThrow<string>('MAIL_GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('MAIL_GOOGLE_CLIENT_SECRET');
    const refreshToken = this.configService.getOrThrow<string>('MAIL_GOOGLE_REFRESH_TOKEN');
    const user = this.configService.getOrThrow<string>('MAIL_GOOGLE_USER');

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { token, res } = await oauth2Client.getAccessToken();

    // Cache the expiry time so we can proactively refresh before expiry
    const responseData: unknown = res?.data;
    const expiryDate =
      responseData !== null &&
      typeof responseData === 'object' &&
      'expiry_date' in responseData &&
      typeof (responseData as { expiry_date: unknown }).expiry_date === 'number'
        ? (responseData as { expiry_date: number }).expiry_date
        : null;
    this.tokenExpiresAt = typeof expiryDate === 'number' ? expiryDate : Date.now() + 3600_000;

    this.cachedTransporter = nodemailer.createTransport({
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

    return this.cachedTransporter;
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.cachedTransporter || this.isTokenExpired()) {
      this.cachedTransporter = await this.buildTransporter();
    }
    return this.cachedTransporter;
  }

  onModuleDestroy(): void {
    if (this.cachedTransporter) {
      this.cachedTransporter.close();
      this.cachedTransporter = null;
    }
  }

  async sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
    const transporter = await this.getTransporter();
    const from = this.configService.getOrThrow<string>('MAIL_DEFAULT_FROM');

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async verify(): Promise<boolean> {
    const transporter = await this.getTransporter();
    return await transporter.verify();
  }
}
