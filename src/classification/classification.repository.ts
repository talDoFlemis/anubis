import type { ClassificationInsert, ClassificationSelect } from '@/database/schema/classifications';

export interface ClassificationRepository {
  create(data: ClassificationInsert): Promise<ClassificationSelect>;
  getByCandidateId(candidateId: string): Promise<ClassificationSelect | null>;
  listByResearchTheme(
    researchThemeId: string,
    stage?: 'mestrado' | 'doutorado',
  ): Promise<ClassificationSelect[]>;
  listAllOrdered(): Promise<ClassificationSelect[]>;
  getRanking(dto?: {
    researchThemeId?: string;
    stage?: 'mestrado' | 'doutorado';
  }): Promise<ClassificationSelect[]>;
}
