import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { hashPassword } from 'src/utils/password';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { InvitationService } from '../invitation/invitation.service';
import { RoleEnum } from '../roles/roles.enum';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import type { User } from '../users/domain/user';
import { UsersService } from '../users/users.service';
import type { InviteSecretaryDto } from './dto/invite-secretary.dto';

@Injectable()
export class SecretaryService {
  private readonly logger = new Logger(SecretaryService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly invitationService: InvitationService,
    private readonly sessionService: SessionService,
  ) {}

  async invite(dto: InviteSecretaryDto): Promise<User> {
    const email = dto.email.toLowerCase().trim();
    const { firstName, lastName } = this.splitName(dto.name.trim());

    this.logger.debug({ email }, 'Inviting secretary');

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Este email ja esta cadastrado.');
    }

    const randomPassword = randomBytes(32).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);

    const user = await this.usersService.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: email,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: RoleEnum.mdccSecretary,
      status: StatusEnum.inactive,
      onboardingCompleted: true,
      mustChangePassword: true,
    });

    await this.invitationService.sendInvitation({
      userId: user.id,
      email,
      currentTokenVersion: user.confirmEmailTokenVersion,
      onboardingPath: '/auth/onboarding/secretary',
    });

    return user;
  }

  async disableAccount(params: { secretaryId: string; actorUserId: string }): Promise<User> {
    const user = await this.requireSecretary(params.secretaryId);

    if (user.status === StatusEnum.disabled) {
      return user;
    }

    const updated = await this.usersService.update(params.secretaryId, {
      status: StatusEnum.disabled,
    });

    if (!updated) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }

    await this.sessionService.deleteByUserId(params.secretaryId);

    this.logAccountToggle({
      action: 'disable',
      secretaryUserId: params.secretaryId,
      actorUserId: params.actorUserId,
    });

    return updated;
  }

  async enableAccount(params: { secretaryId: string; actorUserId: string }): Promise<User> {
    const user = await this.requireSecretary(params.secretaryId);

    if (user.status === StatusEnum.inactive) {
      throw new BadRequestException(
        `Status invalido para reativacao. Esperado: ${StatusEnum.disabled}. Recebido: ${user.status}`,
      );
    }

    if (user.status === StatusEnum.active) {
      return user;
    }

    const updated = await this.usersService.update(params.secretaryId, {
      status: StatusEnum.active,
    });

    if (!updated) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }

    this.logAccountToggle({
      action: 'enable',
      secretaryUserId: params.secretaryId,
      actorUserId: params.actorUserId,
    });

    return updated;
  }

  private async requireSecretary(id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }
    if (user.role !== RoleEnum.mdccSecretary) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }
    return user;
  }

  private logAccountToggle(params: {
    action: 'enable' | 'disable';
    secretaryUserId: string;
    actorUserId: string;
  }): void {
    this.logger.log(
      {
        action: params.action,
        secretaryUserId: params.secretaryUserId,
        actorUserId: params.actorUserId,
        timestamp: new Date().toISOString(),
      },
      'Secretary account status updated',
    );
  }

  private splitName(fullName: string): { firstName: string; lastName: string | null } {
    const parts = fullName.split(/\s+/);
    const firstName = parts[0] ?? fullName;
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;

    return { firstName, lastName };
  }
}
