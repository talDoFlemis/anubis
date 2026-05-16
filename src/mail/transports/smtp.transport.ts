import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { MailTransport } from '../interfaces/mail-transport.interface';

@Injectable()
export class SmtpTransport implements MailTransport {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      auth:
        this.configService.get('MAIL_USER') && this.configService.get('MAIL_PASSWORD')
          ? {
              user: this.configService.get('MAIL_USER'),
              pass: this.configService.get('MAIL_PASSWORD'),
            }
          : undefined,
    });
  }
  verify(): Promise<boolean> {
    return this.transporter.verify();
  }

  async sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow('MAIL_DEFAULT_FROM'),
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
