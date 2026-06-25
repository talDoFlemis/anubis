import { apiClient, type PaginatedResponse } from './client';
import { asBool, asNullableNumber, asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface CandidateProfile {
  userId: string;
  email: string | null;
  cpf: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  universityOfOrigin: string;
  ira: string | null;
  poscomp: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeCandidateProfile(data: unknown): CandidateProfile {
  const r = asRecord(data);
  return {
    userId: asString(r.userId),
    email: asNullableString(r.email),
    cpf: asNullableString(r.cpf),
    firstName: asNullableString(r.firstName),
    lastName: asNullableString(r.lastName),
    role: asString(r.role),
    status: asString(r.status),
    onboardingCompleted: asBool(r.onboardingCompleted),
    universityOfOrigin: asString(r.universityOfOrigin),
    ira: asNullableString(r.ira),
    poscomp: asNullableNumber(r.poscomp),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const candidatesApi = {
  me: async () => normalizeCandidateProfile((await apiClient.get('/candidates/me')).data),

  findById: async (userId: string): Promise<CandidateProfile> => {
    const { data } = await apiClient.get(`/candidates/${userId}`);
    return normalizeCandidateProfile(data);
  },

  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<CandidateProfile>> => {
    const res = await apiClient.get('/candidates', { params });
    const r = asRecord(res.data);
    const m = asRecord(r.pagination || {});
    return {
      data: Array.isArray(r.data) ? r.data.map(normalizeCandidateProfile) : [],
      pagination: {
        page: Number(m.page) || 1,
        limit: Number(m.limit) || 20,
        total: Number(m.total) || 0,
        totalPages: Number(m.totalPages) || 1,
      },
    };
  },
};
