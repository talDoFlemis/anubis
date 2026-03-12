import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MAIL_TRANSPORT } from './interfaces/mail-transport.interface';
import { SmtpTransport } from './transports/smtp.transport';
import { GoogleOauthTransport } from './transports/google-oauth.transport';

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
  ],
  exports: [MailService],
})
export class MailModule {}
