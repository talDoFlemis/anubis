import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';
import { Professor } from './domain/professor';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { FindProfessorsDto } from './dto/find-professor.dto';
import type { ProfessorItemDto } from './dto/professor-response.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorRepository } from './infraestructure/persistence/professor.repository';

@Injectable()
export class ProfessorService {
  constructor(
    private readonly usersService: UsersService,
    private readonly professorRepository: ProfessorRepository,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(ProfessorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(dto: CreateProfessorDto): Promise<Professor> {
    const email = dto.email.toLowerCase().trim();
    const cpf = dto.cpf ?? null;
    const status = dto.status ?? StatusEnum.active;

    this.logger.debug({ email, cpf }, 'Creating professor');

    if (email) {
      const existingEmail = await this.usersService.findByEmail(email);
      if (existingEmail) {
        throw new ConflictException('Este email ja esta cadastrado.');
      }
    }

    if (cpf) {
      const existingCpf = await this.usersService.findByCpf(cpf);
      if (existingCpf) {
        throw new ConflictException('Este CPF ja esta cadastrado.');
      }
    }

    const professor = await this.professorRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: email,
      email,
      cpf,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      role: RoleEnum.professor,
      status,
      department: dto.department,
      institution: dto.institution,
      onboardingCompleted: true,
      mustChangePassword: true,
    });

    const nextConfirmEmailTokenVersion = professor.confirmEmailTokenVersion + 1;
    await this.usersService.update(professor.id, {
      confirmEmailTokenVersion: nextConfirmEmailTokenVersion,
    });

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: professor.id,
        confirmEmailTokenVersion: nextConfirmEmailTokenVersion,
      },
      {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
        expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_EXPIRES_IN'),
      },
    );

    await this.mailService.send({
      to: email,
      title: 'Confirme seu email - Anubis',
      body: this.composeConfirmEmailBody(hash),
    });

    return professor;
  }

  async findOne(id: string): Promise<Professor> {
    return this.requireProfessor(id);
  }

  async findAll(filters: FindProfessorsDto): Promise<PaginatedResponseDto<ProfessorItemDto>> {
    this.logger.debug({ filters }, 'Fetching professors by filters');
    return this.professorRepository.findAllByFilters(filters);
  }

  async update(id: string, dto: UpdateProfessorDto): Promise<Professor> {
    this.logger.debug({ id }, 'Updating professor');

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      const existingEmail = await this.usersService.findByEmail(normalizedEmail);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Este email ja esta cadastrado.');
      }
    }

    if (dto.cpf) {
      const existingCpf = await this.usersService.findByCpf(dto.cpf);
      if (existingCpf && existingCpf.id !== id) {
        throw new ConflictException('Este CPF ja esta cadastrado.');
      }
    }

    const professor = await this.professorRepository.update(id, {
      email: dto.email?.toLowerCase().trim() ?? dto.email,
      cpf: dto.cpf,
      firstName: dto.firstName,
      lastName: dto.lastName,
      status: dto.status,
      department: dto.department,
      institution: dto.institution,
    });

    if (!professor) {
      throw new NotFoundException('Professor nao encontrado.');
    }

    return professor;
  }

  async remove(id: string): Promise<void> {
    this.logger.debug({ id }, 'Removing professor');

    const professor = await this.professorRepository.findById(id);
    if (!professor) {
      throw new NotFoundException(`Professor nao encontrado. Esperado id UUID. Recebido: ${id}`);
    }

    await this.professorRepository.remove(id);
  }

  async disableAccount(params: { professorId: string; actorUserId: string }): Promise<Professor> {
    const professor = await this.requireProfessor(params.professorId);
    const updated = await this.updateProfessorStatusIfNeeded({
      professor,
      professorId: params.professorId,
      nextStatus: StatusEnum.disabled,
    });

    await this.revokeProfessorSessions(params.professorId);
    this.logAccountToggle({
      action: 'disable',
      professorUserId: params.professorId,
      secretaryUserId: params.actorUserId,
    });
    return updated;
  }

  async enableAccount(params: { professorId: string; actorUserId: string }): Promise<Professor> {
    const professor = await this.requireProfessor(params.professorId);
    const updated = await this.enableProfessorIfDisabled({
      professor,
      professorId: params.professorId,
    });

    this.logAccountToggle({
      action: 'enable',
      professorUserId: params.professorId,
      secretaryUserId: params.actorUserId,
    });
    return updated;
  }

  private composeConfirmEmailBody(hash: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/onboarding/professor?hash=${hash}`;

    return `<p>Voce foi cadastrado(a) na plataforma do MDCC. Clique no link abaixo para concluir o seu cadastro:</p><p><a href="${confirmUrl}">Confirmar email</a></p>`;
  }

  private async requireProfessor(id: string): Promise<Professor> {
    this.logger.debug({ id }, 'Fetching professor by id');
    const professor = await this.professorRepository.findById(id);
    if (!professor) {
      throw new NotFoundException(`Professor nao encontrado. Esperado id UUID. Recebido: ${id}`);
    }
    return professor;
  }

  private async updateProfessorStatusIfNeeded(params: {
    professor: Professor;
    professorId: string;
    nextStatus: StatusEnum;
  }): Promise<Professor> {
    if (params.professor.status === params.nextStatus) {
      return params.professor;
    }

    return this.updateProfessorStatus({
      professorId: params.professorId,
      nextStatus: params.nextStatus,
    });
  }

  private async updateProfessorStatus(params: {
    professorId: string;
    nextStatus: StatusEnum;
  }): Promise<Professor> {
    const updated = await this.professorRepository.update(params.professorId, {
      status: params.nextStatus,
    });
    if (!updated) {
      throw new NotFoundException(
        `Professor nao encontrado. Esperado id UUID. Recebido: ${params.professorId}`,
      );
    }
    return updated;
  }

  private async enableProfessorIfDisabled(params: {
    professor: Professor;
    professorId: string;
  }): Promise<Professor> {
    if (params.professor.status === StatusEnum.inactive) {
      throw new BadRequestException(
        `Status invalido para reativacao. Esperado: ${StatusEnum.disabled}. Recebido: ${params.professor.status}`,
      );
    }

    if (params.professor.status !== StatusEnum.disabled) {
      return params.professor;
    }

    return this.updateProfessorStatus({
      professorId: params.professorId,
      nextStatus: StatusEnum.active,
    });
  }

  private async revokeProfessorSessions(professorId: string): Promise<void> {
    await this.sessionService.deleteByUserId(professorId);
  }

  private logAccountToggle(params: {
    action: 'enable' | 'disable';
    professorUserId: string;
    secretaryUserId: string;
  }): void {
    this.logger.info(
      {
        action: params.action,
        professorUserId: params.professorUserId,
        secretaryUserId: params.secretaryUserId,
        timestamp: new Date().toISOString(),
      },
      'Professor account status updated',
    );
  }
}
