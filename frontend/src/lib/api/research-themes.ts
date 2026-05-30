import { apiClient, type PaginatedResponse } from './client';
import { asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface ResearchThemeReference {
  name: string;
  url: string;
}

export interface ResearchThemeProfessor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface ResearchTheme {
  id: string;
  professorId: string;
  title: string;
  description: string;
  vacancies: number;
  level: 'masters' | 'doctoral';
  references: ResearchThemeReference[];
  createdAt: string;
  updatedAt: string;
  professor?: ResearchThemeProfessor;
  associatedProfessors?: ResearchThemeProfessor[];
}

export type PaginatedResearchThemes = PaginatedResponse<ResearchTheme>;

export interface CreateResearchThemePayload {
  title: string;
  description: string;
  vacancies: number;
  level: 'masters' | 'doctoral';
  references?: ResearchThemeReference[];
  associatedProfessorIds?: string[];
}

export interface CreateResearchThemeOnBehalfPayload extends CreateResearchThemePayload {
  professorId: string;
}

export interface UpdateResearchThemePayload {
  title?: string;
  description?: string;
  vacancies?: number;
  level?: 'masters' | 'doctoral';
  references?: ResearchThemeReference[];
  associatedProfessorIds?: string[];
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeProfessor(data: unknown): ResearchThemeProfessor {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    firstName: r.firstName ? asString(r.firstName) : null,
    lastName: r.lastName ? asString(r.lastName) : null,
    email: r.email ? asString(r.email) : null,
  };
}

function normalizeReference(data: unknown): ResearchThemeReference {
  const r = asRecord(data);
  return {
    name: asString(r.name),
    url: asString(r.url),
  };
}

function normalizeResearchTheme(data: unknown): ResearchTheme {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    professorId: asString(r.professorId),
    title: asString(r.title),
    description: asString(r.description),
    vacancies: Number(r.vacancies) || 0,
    level: asString(r.level) as 'masters' | 'doctoral',
    references: Array.isArray(r.references) ? r.references.map(normalizeReference) : [],
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
    professor: r.professor ? normalizeProfessor(r.professor) : undefined,
    associatedProfessors: Array.isArray(r.associatedProfessors)
      ? r.associatedProfessors.map(normalizeProfessor)
      : [],
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const researchThemesApi = {
  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    professorId?: string;
    level?: 'masters' | 'doctoral';
  }): Promise<PaginatedResearchThemes> => {
    const res = await apiClient.get('/research-themes', { params });
    const r = asRecord(res.data);
    const m = asRecord(r.pagination || {});
    return {
      data: Array.isArray(r.data) ? r.data.map(normalizeResearchTheme) : [],
      pagination: {
        page: Number(m.page) || 1,
        limit: Number(m.limit) || 20,
        total: Number(m.total) || 0,
        totalPages: Number(m.totalPages) || 1,
      },
    };
  },

  findById: async (id: string): Promise<ResearchTheme> => {
    const res = await apiClient.get(`/research-themes/${id}`);
    return normalizeResearchTheme(res.data);
  },

  create: async (payload: CreateResearchThemePayload): Promise<ResearchTheme> => {
    const res = await apiClient.post('/research-themes', payload);
    return normalizeResearchTheme(res.data);
  },

  createOnBehalf: async (payload: CreateResearchThemeOnBehalfPayload): Promise<ResearchTheme> => {
    const res = await apiClient.post('/research-themes/on-behalf', payload);
    return normalizeResearchTheme(res.data);
  },

  update: async (id: string, payload: UpdateResearchThemePayload): Promise<ResearchTheme> => {
    const res = await apiClient.patch(`/research-themes/${id}`, payload);
    return normalizeResearchTheme(res.data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/research-themes/${id}`);
  },
};
