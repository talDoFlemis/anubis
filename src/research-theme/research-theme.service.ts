import type { PaginatedResult } from '@/common/dto/paginated-response.dto';
import { RoleEnum } from '@/roles/roles.enum';
import { UsersService } from '@/users/users.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ResearchTheme } from './domain/research-theme';
import { CreateResearchThemeOnBehalfDto } from './dto/create-research-theme-on-behalf.dto';
import { CreateResearchThemeDto } from './dto/create-research-theme.dto';
import { FindResearchThemesDto } from './dto/find-research-themes.dto';
import { UpdateResearchThemeDto } from './dto/update-research-theme.dto';
import { ResearchThemeRepository } from './infrastructure/persistence/research-theme.repository';

@Injectable()
export class ResearchThemeService {
  private readonly logger = new Logger(ResearchThemeService.name);
  constructor(
    private readonly researchThemeRepository: ResearchThemeRepository,
    private readonly usersService: UsersService,
  ) {}

  async createForProfessor(userId: string, dto: CreateResearchThemeDto): Promise<ResearchTheme> {
    await this.assertProfessor(userId);
    return this.create({ ...dto, professorId: userId });
  }

  async createOnBehalf(dto: CreateResearchThemeOnBehalfDto): Promise<ResearchTheme> {
    await this.assertProfessor(dto.professorId);
    return this.create(dto);
  }

  async findById(id: string): Promise<ResearchTheme> {
    const theme = await this.researchThemeRepository.findById(id);
    if (!theme) {
      throw new NotFoundException('Tema de pesquisa nao encontrado.');
    }
    return theme;
  }

  async findAll(filters: FindResearchThemesDto): Promise<PaginatedResult<ResearchTheme>> {
    return this.researchThemeRepository.findAllByFilters(filters);
  }

  async update(params: {
    id: string;
    actorUserId: string;
    actorRole: RoleEnum;
    dto: UpdateResearchThemeDto;
  }): Promise<ResearchTheme> {
    const theme = await this.requireTheme(params.id);
    this.assertActorCanManage(params.actorRole, params.actorUserId, theme.professorId);

    const updated = await this.researchThemeRepository.update(params.id, {
      title: params.dto.title,
      description: params.dto.description,
      vacancies: params.dto.vacancies,
      level: params.dto.level,
      references: params.dto.references,
    });

    if (!updated) {
      throw new NotFoundException('Tema de pesquisa nao encontrado.');
    }

    return updated;
  }

  async remove(params: { id: string; actorUserId: string; actorRole: RoleEnum }): Promise<void> {
    const theme = await this.requireTheme(params.id);
    this.assertActorCanManage(params.actorRole, params.actorUserId, theme.professorId);

    const hasEnrollments = await this.researchThemeRepository.hasEnrollments(theme.id);
    if (hasEnrollments) {
      throw new BadRequestException('Tema possui candidatos inscritos e nao pode ser removido.');
    }

    await this.researchThemeRepository.remove(theme.id);
  }

  private async create(params: {
    professorId: string;
    title: string;
    description: string;
    vacancies: number;
    level: ResearchTheme['level'];
    references?: ResearchTheme['references'];
  }): Promise<ResearchTheme> {
    this.logger.debug({ professorId: params.professorId }, 'Creating research theme');

    const references = params.references ?? [];

    return this.researchThemeRepository.create({
      professorId: params.professorId,
      title: params.title,
      description: params.description,
      vacancies: params.vacancies,
      level: params.level,
      references,
    });
  }

  private async assertProfessor(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== RoleEnum.professor) {
      throw new BadRequestException(
        `Professor nao encontrado. Esperado usuario professor com id: ${userId}`,
      );
    }
  }

  private assertActorCanManage(actorRole: RoleEnum, actorUserId: string, ownerId: string): void {
    if (actorRole === RoleEnum.mdccSecretary) {
      return;
    }

    if (actorRole !== RoleEnum.professor || actorUserId !== ownerId) {
      throw new ForbiddenException('Permissoes insuficientes para gerenciar tema de pesquisa.');
    }
  }

  private async requireTheme(id: string): Promise<ResearchTheme> {
    const theme = await this.researchThemeRepository.findById(id);
    if (!theme) {
      throw new NotFoundException('Tema de pesquisa nao encontrado.');
    }
    return theme;
  }
}
