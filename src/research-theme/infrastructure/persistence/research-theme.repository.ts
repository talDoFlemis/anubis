import type { PaginatedResult } from '@/common/dto/paginated-response.dto';
import type { ResearchThemeReference } from '@/common/types/research-theme-reference';
import type { ResearchTheme } from '@/research-theme/domain/research-theme';
import type { FindResearchThemesDto } from '@/research-theme/dto/find-research-themes.dto';
import type { ResearchThemeLevelEnum } from '@/research-theme/research-theme-level.enum';

export interface CreateResearchThemeData {
  professorId: string;
  title: string;
  description: string;
  vacancies: number;
  level: ResearchThemeLevelEnum;
  references: ResearchThemeReference[];
  associatedProfessorIds?: string[];
}

export interface UpdateResearchThemeData {
  title?: string;
  description?: string;
  vacancies?: number;
  level?: ResearchThemeLevelEnum;
  references?: ResearchThemeReference[];
  associatedProfessorIds?: string[];
}

export abstract class ResearchThemeRepository {
  abstract create(data: CreateResearchThemeData): Promise<ResearchTheme>;
  abstract findById(id: string): Promise<ResearchTheme | null>;
  abstract findAllByFilters(
    filters: FindResearchThemesDto,
  ): Promise<PaginatedResult<ResearchTheme>>;
  abstract update(id: string, data: UpdateResearchThemeData): Promise<ResearchTheme | null>;
  abstract remove(id: string): Promise<void>;
  abstract hasEnrollments(id: string): Promise<boolean>;
}
