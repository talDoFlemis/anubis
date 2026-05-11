import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MailService } from '../mail/mail.service';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';
import { Professor } from './domain/professor';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorRepository } from './infraestructure/persistence/professor.repository';

@Injectable()
export class ProfessorService {
  constructor(
    private readonly usersService: UsersService,
    private readonly professorRepository: ProfessorRepository,
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
    this.logger.debug({ id }, 'Fetching professor by id');

    const professor = await this.professorRepository.findById(id);
    if (!professor) {
      throw new NotFoundException('Professor nao encontrado.');
    }

    return professor;
  }

  findByDepartment(department: string): Promise<Professor[]> {
    this.logger.debug({ department }, 'Fetching professors by department');
    return this.professorRepository.findByDepartment(department);
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
      throw new NotFoundException('Professor nao encontrado.');
    }

    await this.professorRepository.remove(id);
  }

  private composeConfirmEmailBody(hash: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/onboarding/professor?hash=${hash}`;

    return `<p>Voce foi cadastrado(a) na plataforma do MDCC. Clique no link abaixo para concluir o seu cadastro:</p><p><a href="${confirmUrl}">Confirmar email</a></p>`;
  }
}
