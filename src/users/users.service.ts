import { ConflictException, Injectable } from '@nestjs/common';
import {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { UserInviteDto } from './dto/user-invite.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { MailService } from 'src/mail/mail.service';

const BOOTSTRAP_PASSWORD_TTL_HOURS = 24;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
  ) {}

  create(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findByCpf(cpf: string): Promise<User | null> {
    return this.userRepository.findByCpf(cpf);
  }

  findByAuthProvider(params: {
    provider: AuthProvidersEnum;
    providerSubject: string;
  }): Promise<User | null> {
    return this.userRepository.findByAuthProvider(params);
  }

  update(id: string, payload: UpdateUserData): Promise<User | null> {
    return this.userRepository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }

  async invite(dto: UserInviteDto): Promise<void> {
    const email = dto.email;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Este e-mail ja esta cadastrado.');
    }

    const existingCpf = await this.findByCpf(dto.cpf);
    if (existingCpf) {
      throw new ConflictException('Este CPF ja esta cadastrado.');
    }

    const bootstrapPasswordExpiresAt = new Date(
      Date.now() + BOOTSTRAP_PASSWORD_TTL_HOURS * 60 * 60 * 1000,
    );

    // TODO: Maybe check if secretary can create coordinator
    const user = await this.create({
      email,
      password: '',
      cpf: dto.cpf,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: StatusEnum.inactive,
      authProvider: AuthProvidersEnum.email,
      providerSubject: '',
      onboardingCompleted: false,
      mustChangePassword: true,
      bootstrapPasswordExpiresAt,
    });

    const body = this.composeInviteEmail(
      dto.firstName,
      dto.email,
      bootstrapPasswordExpiresAt,
    );

    await this.mailService.send({
      to: user.email!,
      title: 'Convite para acesso - Anubis',
      body,
    });

    this.logger.debug({ email }, 'Professor invite requested');
  }

  private composeInviteEmail(
    firstName: string,
    email: string,
    expiresAt: Date,
  ): string {
    return `
      <h1>Convite de acesso ao Anubis</h1>
      <p>Ola, ${firstName}.</p>
      <p>Seu acesso de professor foi criado. Use as credenciais abaixo para entrar e altere a senha no primeiro acesso.</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Validade do convite temporaria:</strong> ${expiresAt.toISOString()}</p>
      <p>Se voce nao esperava este convite, entre em contato com a administracao.</p>
    `;
  }
}
