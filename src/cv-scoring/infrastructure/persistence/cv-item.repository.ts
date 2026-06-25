import type { CvScoringCategorySelect } from '../../../database/schema/cv-scoring';
import type { EnrollmentSelect } from '../../../database/schema/enrollments';
import type { CvItem } from '../../domain/cv-item';

export interface CreateCvItemData {
  enrollmentId: string;
  scoringCategoryId: string;
  description: string;
  quantity: number;
  proofFileId: string | null;
  classification?: string | null;
  isComplete?: boolean;
  isResumo?: boolean;
  isPeriodico?: boolean;
  isAutorPrincipal?: boolean;
  isDissertacao?: boolean;
  isEncontroIc?: boolean;
  isInArea?: boolean;
  docenciaType?: string | null;
  eventoType?: string | null;
}

export interface UpdateCvItemData {
  description?: string;
  quantity?: number;
  scoringCategoryId?: string;
  proofFileId?: string | null;
  classification?: string | null;
  isComplete?: boolean;
  isResumo?: boolean;
  isPeriodico?: boolean;
  isAutorPrincipal?: boolean;
  isDissertacao?: boolean;
  isEncontroIc?: boolean;
  isInArea?: boolean;
  docenciaType?: string | null;
  eventoType?: string | null;
  isVerified?: string;
  correctedClassification?: string | null;
  verificationComment?: string | null;
  updatedAt: Date;
  score?: number | null;
}

export abstract class CvItemRepository {
  abstract create(data: CreateCvItemData): Promise<CvItem>;

  abstract findByEnrollment(enrollmentId: string): Promise<CvItem[]>;

  abstract findById(itemId: string): Promise<CvItem | null>;

  abstract update(itemId: string, data: UpdateCvItemData): Promise<CvItem>;

  abstract remove(itemId: string): Promise<void>;

  abstract findEnrollmentById(enrollmentId: string): Promise<EnrollmentSelect | null>;

  abstract findScoringCategoryById(categoryId: string): Promise<CvScoringCategorySelect | null>;

  abstract updateEnrollmentScore(enrollmentId: string, scoreDraft: string): Promise<void>;
}
