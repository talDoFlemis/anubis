import { apiClient } from './client';
import { asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface EnrollmentPeriod {
  id: string;
  name: string;
  level: string;
  semester: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeEnrollmentPeriod(data: unknown): EnrollmentPeriod {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    name: asString(r.name),
    level: asString(r.level),
    semester: asString(r.semester),
    startDate: asString(r.startDate),
    endDate: asString(r.endDate),
    status: asString(r.status),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const enrollmentPeriodsApi = {
  findAll: async (): Promise<EnrollmentPeriod[]> => {
    const { data } = await apiClient.get('/enrollment-periods');
    return (data as unknown[]).map(normalizeEnrollmentPeriod);
  },

  findActive: async (): Promise<EnrollmentPeriod[]> => {
    const { data } = await apiClient.get('/enrollment-periods/active');
    return (data as unknown[]).map(normalizeEnrollmentPeriod);
  },

  findById: async (id: string): Promise<EnrollmentPeriod> => {
    return normalizeEnrollmentPeriod((await apiClient.get(`/enrollment-periods/${id}`)).data);
  },
};
