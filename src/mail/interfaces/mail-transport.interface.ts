export interface MailTransport {
  sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
