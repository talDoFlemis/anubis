import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { MAIL_TRANSPORT } from './interfaces/mail-transport.interface';
import { MailHealthIndicator } from './mail.health';
import { MailService } from './mail.service';
import { GoogleOauthTransport } from './transports/google-oauth.transport';
import { SmtpTransport } from './transports/smtp.transport';

@Module({
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const transport = configService.getOrThrow<string>('MAIL_TRANSPORT');

        if (transport === 'google-oauth') {
          return new GoogleOauthTransport(configService);
        }

        return new SmtpTransport(configService);
      },
    },
    MailService,
    HealthIndicatorService,
    MailHealthIndicator,
  ],
  exports: [MailService, MailHealthIndicator],
})
export class MailModule {}
