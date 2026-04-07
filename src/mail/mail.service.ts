import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MAIL_TRANSPORT, type MailTransport } from './interfaces/mail-transport.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    @InjectPinoLogger(MailService.name)
    private readonly logger: PinoLogger,
  ) {}

  async send(params: { to: string; title: string; body: string }): Promise<void> {
    this.logger.debug({ to: params.to, title: params.title }, 'Sending e-mail');

    try {
      await this.transport.sendMail({
        to: params.to,
        subject: params.title,
        html: params.body,
      });
      this.logger.info({ to: params.to, title: params.title }, 'E-mail sent');
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          to: params.to,
          title: params.title,
        },
        'Failed to send e-mail',
      );
      throw error;
    }
  }
}
