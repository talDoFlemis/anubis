import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Professor } from './domain/professor';
import { ProfessorRepository } from './infraestructure/persistence/professor.repository';

@Injectable()
export class ProfessorService {
  constructor(
    private readonly usersService: UsersService,
    private readonly professorRepository: ProfessorRepository,
    @InjectPinoLogger(ProfessorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(dto: CreateProfessorDto): Promise<Professor> {
    const email = dto.email ?? null;
    const cpf = dto.cpf ?? null;
    const role = dto.role ?? RoleEnum.professor;
    const status = dto.status ?? StatusEnum.active;
    const authProvider = dto.authProvider ?? AuthProvidersEnum.email;

    this.logger.debug({ email, cpf, role }, 'Creating professor');

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

    if (dto.password && authProvider !== AuthProvidersEnum.email) {
      throw new BadRequestException('Senha so pode ser informada para authProvider email.');
    }

    return this.professorRepository.create({
      authProvider,
      providerSubject: dto.providerSubject ?? null,
      email,
      password: dto.password ?? null,
      cpf,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      role,
      status,
      department: dto.department,
      institution: dto.institution,
      onboardingCompleted: dto.password ? false : true,
      mustChangePassword: dto.password ? true : false,
    });
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
      const existingEmail = await this.usersService.findByEmail(dto.email);
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

    const effectiveProvider = dto.authProvider ?? AuthProvidersEnum.email;
    if (dto.password && effectiveProvider !== AuthProvidersEnum.email) {
      throw new BadRequestException('Senha so pode ser informada para authProvider email.');
    }

    const professor = await this.professorRepository.update(id, {
      authProvider: dto.authProvider,
      providerSubject: dto.providerSubject,
      email: dto.email,
      password: dto.password,
      cpf: dto.cpf,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: dto.status,
      department: dto.department,
      institution: dto.institution,
      onboardingCompleted: dto.password ? false : undefined,
      mustChangePassword: dto.password ? true : undefined,
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
}
