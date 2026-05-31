import type { ResearchThemeReference } from '@/common/types/research-theme-reference';
import type { ResearchThemeLevelEnum } from '../research-theme-level.enum';

export class ResearchTheme {
  id!: string;
  professorId!: string;
  title!: string;
  description!: string;
  vacancies!: number;
  level!: ResearchThemeLevelEnum;
  references!: ResearchThemeReference[];
  createdAt!: Date;
  updatedAt!: Date;
  professor?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  associatedProfessors?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  }[];
}
