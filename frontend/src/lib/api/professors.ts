import { apiClient, type PaginatedResponse } from './client';
import { asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface ProfessorItem {
  id: string;
  department: string;
  institution: string;
  name: string;
  status: string;
  email: string;
}

export type PaginatedProfessors = PaginatedResponse<ProfessorItem>;

export interface InviteProfessorPayload {
  email: string;
  cpf?: string | null;
  firstName: string;
  lastName?: string | null;
  department: string;
  institution: string;
  status?: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeProfessorItem(data: unknown): ProfessorItem {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    department: asString(r.department),
    institution: asString(r.institution),
    name: asString(r.name),
    status: asString(r.status),
    email: asString(r.email),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const professorsApi = {
  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedProfessors> => {
    const res = await apiClient.get('/professors', { params });
    const r = asRecord(res.data);
    const m = asRecord(r.pagination || {});
    return {
      data: Array.isArray(r.data) ? r.data.map(normalizeProfessorItem) : [],
      pagination: {
        page: Number(m.page) || 1,
        limit: Number(m.limit) || 10,
        total: Number(m.total) || 0,
        totalPages: Number(m.totalPages) || 1,
      },
    };
  },
  invite: async (payload: InviteProfessorPayload): Promise<void> => {
    await apiClient.post('/professors/invite', payload);
  },
  enable: async (id: string): Promise<void> => {
    await apiClient.patch(`/professors/${id}/enable`);
  },
  disable: async (id: string): Promise<void> => {
    await apiClient.patch(`/professors/${id}/disable`);
  },
};
