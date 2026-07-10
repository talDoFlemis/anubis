import { apiClient, type PaginatedResponse } from './client';
import { asRecord, asString } from './normalizers';

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
  primaryThemeId?: string | null;
  secondaryThemeId?: string | null;
  ira?: number | null;
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
    declaredScore:
      typeof r.declaredScore === 'number'
        ? r.declaredScore
        : parseFloat(r.declaredScore as string) || 0,
    validatedScore:
      typeof r.validatedScore === 'number'
        ? r.validatedScore
        : r.validatedScore
          ? parseFloat(r.validatedScore as string)
          : null,
    status: asString(r.status) as ValidationStatus,
    submittedAt: asString(r.submittedAt),
    primaryThemeId: r.primaryThemeId ? asString(r.primaryThemeId) : null,
    secondaryThemeId: r.secondaryThemeId ? asString(r.secondaryThemeId) : null,
    ira:
      r.ira !== undefined && r.ira !== null
        ? typeof r.ira === 'number'
          ? r.ira
          : parseFloat(r.ira as string)
        : null,
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const validationApi = {
  getSecretaryStats: async (): Promise<SecretaryDashboardStats> => {
    const { data } = await apiClient.get('/validation/stats');
    const r = asRecord(data);
    return {
      total: Number(r.total) || 0,
      validated: Number(r.validated) || 0,
      pending: Number(r.pending) || 0,
      inProgress: Number(r.inProgress) || 0,
    };
  },

  findCandidates: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
    status?: string;
    professor?: string;
    themeId?: string;
  }): Promise<PaginatedValidationCandidates> => {
    const { data } = await apiClient.get('/validation/candidates');
    let list = Array.isArray(data) ? data.map(normalizeCandidateValidation) : [];

    if (params?.search) {
      const search = params.search.toLowerCase();
      list = list.filter(c => c.candidateName.toLowerCase().includes(search));
    }

    if (params?.level && params.level !== 'all') {
      const levelFilter = params.level.toLowerCase();
      list = list.filter(c => c.level?.toLowerCase() === levelFilter);
    }

    if (params?.status && params.status !== 'all') {
      const statusFilter = params.status;
      list = list.filter(c => c.status === statusFilter);
    }

    if (params?.professor && params.professor !== 'all') {
      const professorFilter = params.professor.toLowerCase();
      list = list.filter(c => c.professorName?.toLowerCase().includes(professorFilter));
    }

    if (params?.themeId) {
      list = list.filter(
        c => c.primaryThemeId === params.themeId || c.secondaryThemeId === params.themeId,
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;
    const paginatedData = list.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: list.length,
        totalPages: Math.ceil(list.length / limit) || 1,
      },
    };
  },

  getDetails: async (enrollmentId: string) => {
    return { id: enrollmentId };
  },

  updateScore: async (
    enrollmentId: string,
    itemId: string,
    payload: {
      status: 'accepted' | 'partial' | 'rejected';
      adjustedScore?: number;
      justification?: string;
    },
  ) => {
    const { data } = await apiClient.patch(
      `/enrollments/${enrollmentId}/cv-items/${itemId}/verify`,
      payload,
    );
    return data;
  },
};
