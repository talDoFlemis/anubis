export interface MailTransport {
  sendMail(options: { to: string; subject: string; html: string }): Promise<void>;
  verify(): Promise<boolean>;
}

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
