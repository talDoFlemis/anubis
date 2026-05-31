import { apiClient } from './client';
import { asBool, asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface ScoringCategory {
  id: string;
  enrollmentPeriodId: string;
  name: string;
  description: string | null;
  pointsPerItem: string;
  maxPoints: string;
  level: string;
  requiresAreaVerification: boolean;
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
    requiresAreaVerification: asBool(r.requiresAreaVerification),
    sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0,
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
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
};
