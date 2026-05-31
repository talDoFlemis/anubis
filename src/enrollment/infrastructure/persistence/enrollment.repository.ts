import type { PaginatedResult } from '../../../common/dto/paginated-response.dto';
import type { Enrollment } from '../../domain/enrollment';

export interface CreateEnrollmentData {
  candidateId: string;
  enrollmentPeriodId: string;
  level: string;
  status: string;
}

export interface UpdateEnrollmentData {
  phone?: string;
  justification?: string;
  sigaaCode?: string;
  declaration?: boolean;
  poscomp?: Record<string, unknown>;
  updatedAt: Date;
}

export interface FindEnrollmentsFilters {
  candidateId?: string;
  enrollmentPeriodId?: string;
  status?: string;
  level?: string;
  page: number;
  limit: number;
}

export abstract class EnrollmentRepository {
  abstract findById(id: string): Promise<Enrollment | null>;

  abstract findByCandidateId(candidateId: string): Promise<Enrollment[]>;

  abstract findByCandidateAndPeriod(
    candidateId: string,
    enrollmentPeriodId: string,
  ): Promise<Enrollment | null>;

  abstract findAll(filters: FindEnrollmentsFilters): Promise<PaginatedResult<Enrollment>>;

  abstract create(data: CreateEnrollmentData): Promise<Enrollment>;

  abstract update(id: string, data: Record<string, unknown>): Promise<Enrollment | null>;

  abstract remove(id: string): Promise<void>;
}
