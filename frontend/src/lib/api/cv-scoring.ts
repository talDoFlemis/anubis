import { apiClient } from './client';
import { asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface ScoringCategory {
  id: string;
  enrollmentPeriodId: string;
  name: string;
  description: string | null;
  pointsPerItem: string;
  maxPoints: string;
  level: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeScoringCategory(data: unknown): ScoringCategory {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    enrollmentPeriodId: asString(r.enrollmentPeriodId),
    name: asString(r.name),
    description: asNullableString(r.description),
    pointsPerItem: asString(r.pointsPerItem),
    maxPoints: asString(r.maxPoints),
    level: asString(r.level),
    sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0,
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── Payloads ─────────────────────────────────────────────────────────

export interface CreateScoringCategoryPayload {
  name: string;
  description?: string;
  pointsPerItem: number;
  maxPoints: number;
  level: 'masters' | 'doctoral';
  sortOrder?: number;
}

export interface UpdateScoringCategoryPayload {
  name?: string;
  description?: string;
  pointsPerItem?: number;
  maxPoints?: number;
  level?: 'masters' | 'doctoral';
  sortOrder?: number;
}

// ── Endpoints ────────────────────────────────────────────────────────

export const cvScoringApi = {
  findCategories: async (periodId: string, level?: string): Promise<ScoringCategory[]> => {
    const params = level ? { level } : {};
    const { data } = await apiClient.get(`/enrollment-periods/${periodId}/scoring-categories`, {
      params,
    });
    return (data as unknown[]).map(normalizeScoringCategory);
  },

  createCategory: async (
    periodId: string,
    payload: CreateScoringCategoryPayload,
  ): Promise<ScoringCategory> => {
    const { data } = await apiClient.post(
      `/enrollment-periods/${periodId}/scoring-categories`,
      payload,
    );
    return normalizeScoringCategory(data);
  },

  updateCategory: async (
    id: string,
    payload: UpdateScoringCategoryPayload,
  ): Promise<ScoringCategory> => {
    const { data } = await apiClient.patch(`/scoring-categories/${id}`, payload);
    return normalizeScoringCategory(data);
  },

  removeCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/scoring-categories/${id}`);
  },

  copyFromPeriod: async (
    targetPeriodId: string,
    sourcePeriodId: string,
  ): Promise<ScoringCategory[]> => {
    const { data } = await apiClient.post(
      `/enrollment-periods/${targetPeriodId}/scoring-categories/copy`,
      { sourcePeriodId },
    );
    return (data as unknown[]).map(normalizeScoringCategory);
  },
};
