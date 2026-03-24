import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { MailService } from '../mail/mail.service';
import { InviteProfessorDto } from './dto/invite-professor.dto';

const BCRYPT_SALT_ROUNDS = 12;
const BOOTSTRAP_PASSWORD_TTL_HOURS = 24;

@Injectable()
export class ProfessorsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    @InjectPinoLogger(ProfessorsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async inviteProfessor(params: InviteProfessorDto): Promise<void> {
    const email = params.email.toLowerCase().trim();
    this.logger.debug({ email }, 'Professor invite requested');

    try {
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Este e-mail ja esta cadastrado.');
      }

      if (params.cpf) {
        const existingCpf = await this.usersService.findByCpf(params.cpf);
        if (existingCpf) {
          throw new ConflictException('Este CPF ja esta cadastrado.');
        }
      }

      const temporaryPassword = randomBytes(9).toString('base64url');
      const hashedPassword = await bcrypt.hash(
        temporaryPassword,
        BCRYPT_SALT_ROUNDS,
      );
      const bootstrapPasswordExpiresAt = new Date(
        Date.now() + BOOTSTRAP_PASSWORD_TTL_HOURS * 60 * 60 * 1000,
      );

      const user = await this.usersService.create({
        email,
        password: hashedPassword,
        cpf: params.cpf ?? null,
        firstName: params.firstName,
        lastName: params.lastName,
        role: RoleEnum.professor,
        status: StatusEnum.active,
        authProvider: AuthProvidersEnum.email,
        providerSubject: email,
        onboardingCompleted: true,
        mustChangePassword: true,
        bootstrapPasswordExpiresAt,
      });

      const body = this.composeProfessorInviteEmail({
        firstName: user.firstName ?? 'Professor(a)',
        email: user.email!,
        temporaryPassword,
        expiresAt: bootstrapPasswordExpiresAt,
      });

      await this.mailService.send({
        to: user.email!,
        title: 'Convite para acesso - Anubis',
        body,
      });

      this.logger.info({ userId: user.id, email }, 'Professor invited');
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          email,
        },
        'Professor invite failed',
      );
      throw error;
    }
  }

  private composeProfessorInviteEmail(params: {
    firstName: string;
    email: string;
    temporaryPassword: string;
    expiresAt: Date;
  }): string {
    return `
      <h1>Convite de acesso ao Anubis</h1>
      <p>Ola, ${params.firstName}.</p>
      <p>Seu acesso de professor foi criado. Use as credenciais abaixo para entrar e altere a senha no primeiro acesso.</p>
      <p><strong>E-mail:</strong> ${params.email}</p>
      <p><strong>Senha temporaria:</strong> ${params.temporaryPassword}</p>
      <p><strong>Validade da senha temporaria:</strong> ${params.expiresAt.toISOString()}</p>
      <p>Se voce nao esperava este convite, entre em contato com a administracao.</p>
    `;
  }
}
