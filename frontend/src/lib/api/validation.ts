import { type PaginatedResponse } from './client';
import { asRecord, asString } from './normalizers';

import { mockValidationCandidates } from '@/lib/mock-validation-data';

// ── Types ────────────────────────────────────────────────────────────

export type ValidationStatus = 'pending' | 'in_progress' | 'completed';

export interface CandidateValidationSummary {
  enrollmentId: string;
  candidateName: string;
  candidateEmail: string;
  themeName: string;
  professorName?: string;
  level?: string;
  declaredScore: number;
  validatedScore: number | null;
  status: ValidationStatus;
  submittedAt: string;
}

export type PaginatedValidationCandidates = PaginatedResponse<CandidateValidationSummary>;

export interface SecretaryDashboardStats {
  total: number;
  validated: number;
  pending: number;
  inProgress: number;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeCandidateValidation(data: unknown): CandidateValidationSummary {
  const r = asRecord(data);
  return {
    enrollmentId: asString(r.enrollmentId),
    candidateName: asString(r.candidateName),
    candidateEmail: asString(r.candidateEmail),
    themeName: asString(r.themeName),
    professorName: r.professorName ? asString(r.professorName) : undefined,
    level: r.level ? asString(r.level) : undefined,
    declaredScore: typeof r.declaredScore === 'number' ? r.declaredScore : 0,
    validatedScore: typeof r.validatedScore === 'number' ? r.validatedScore : null,
    status: asString(r.status) as ValidationStatus,
    submittedAt: asString(r.submittedAt),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const validationApi = {
  getSecretaryStats: async (): Promise<SecretaryDashboardStats> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          total: 120,
          validated: 45,
          pending: 65,
          inProgress: 10,
        });
      }, 600);
    });
  },

  findCandidates: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
    status?: string;
    professor?: string;
  }): Promise<PaginatedValidationCandidates> => {
    return new Promise(resolve => {
      setTimeout(() => {
        let mockData = [...mockValidationCandidates].map(normalizeCandidateValidation);

        if (params?.search) {
          const search = params.search.toLowerCase();
          mockData = mockData.filter(c => c.candidateName.toLowerCase().includes(search));
        }

        if (params?.level && params.level !== 'all') {
          const levelFilter = params.level.toLowerCase();
          mockData = mockData.filter(c => c.level?.toLowerCase() === levelFilter);
        }

        if (params?.status && params.status !== 'all') {
          const statusFilter = params.status;
          mockData = mockData.filter(c => c.status === statusFilter);
        }

        if (params?.professor && params.professor !== 'all') {
          const professorFilter = params.professor.toLowerCase();
          mockData = mockData.filter(c => c.professorName?.toLowerCase().includes(professorFilter));
        }

        resolve({
          data: mockData,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: mockData.length,
            totalPages: 1,
          },
        });
      }, 800);
    });
  },

  getDetails: async (_enrollmentId: string) => {
    return { id: _enrollmentId };
  },

  updateScore: async (_enrollmentId: string, _itemId: string, _score: number | null) => {
    return new Promise(resolve => setTimeout(resolve, 500));
  },
};
