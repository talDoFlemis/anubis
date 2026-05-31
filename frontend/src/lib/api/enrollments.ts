import { apiClient } from './client';
import { asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface PoscompData {
  hasPoscomp: boolean;
  year?: number;
  mathScore?: number;
  fundamentalsScore?: number;
  technologyScore?: number;
  receiptFileId?: string;
}

export interface MastersDegreeData {
  university: string;
  graduateProgram: string;
  ira: number;
  isPrimary: boolean;
}

export interface Enrollment {
  id: string;
  candidateId: string;
  enrollmentPeriodId: string;
  level: string;
  status: string;
  phone: string | null;
  justification: string | null;
  sigaaCode: string | null;
  sigaaReceiptFileId: string | null;
  declaration: boolean | null;
  poscomp: PoscompData | null;
  mastersDegrees: MastersDegreeData[] | null;
  scoreDraft: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentPayload {
  level: string;
  enrollmentPeriodId: string;
}

export interface UpdateEnrollmentPayload {
  phone?: string;
  justification?: string;
  sigaaCode?: string;
  declaration?: boolean;
  poscomp?: PoscompData;
}

export interface UpdateMastersDegreesPayload {
  mastersDegrees: MastersDegreeData[];
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeEnrollment(data: unknown): Enrollment {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    candidateId: asString(r.candidateId),
    enrollmentPeriodId: asString(r.enrollmentPeriodId),
    level: asString(r.level),
    status: asString(r.status),
    phone: asNullableString(r.phone),
    justification: asNullableString(r.justification),
    sigaaCode: asNullableString(r.sigaaCode),
    sigaaReceiptFileId: asNullableString(r.sigaaReceiptFileId),
    declaration: r.declaration != null ? Boolean(r.declaration) : null,
    poscomp: (r.poscomp as PoscompData | null) ?? null,
    mastersDegrees: (r.mastersDegrees as MastersDegreeData[] | null) ?? null,
    scoreDraft: asNullableString(r.scoreDraft),
    submittedAt: asNullableString(r.submittedAt),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const enrollmentsApi = {
  create: async (payload: CreateEnrollmentPayload): Promise<Enrollment> => {
    return normalizeEnrollment((await apiClient.post('/enrollments', payload)).data);
  },

  findMine: async (): Promise<Enrollment[]> => {
    const { data } = await apiClient.get('/enrollments/me');
    return (data as unknown[]).map(normalizeEnrollment);
  },

  findById: async (id: string): Promise<Enrollment> => {
    return normalizeEnrollment((await apiClient.get(`/enrollments/${id}`)).data);
  },

  update: async (id: string, payload: UpdateEnrollmentPayload): Promise<Enrollment> => {
    return normalizeEnrollment((await apiClient.patch(`/enrollments/${id}`, payload)).data);
  },

  submit: async (id: string): Promise<Enrollment> => {
    return normalizeEnrollment((await apiClient.post(`/enrollments/${id}/submit`)).data);
  },

  updateMastersDegrees: async (
    id: string,
    payload: UpdateMastersDegreesPayload,
  ): Promise<Enrollment> => {
    return normalizeEnrollment(
      (await apiClient.put(`/enrollments/${id}/masters-degrees`, payload)).data,
    );
  },

  getMastersDegrees: async (id: string): Promise<MastersDegreeData[] | null> => {
    const { data } = await apiClient.get(`/enrollments/${id}/masters-degrees`);
    return (data as MastersDegreeData[] | null) ?? null;
  },
};
