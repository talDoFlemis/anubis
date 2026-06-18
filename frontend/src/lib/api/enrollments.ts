import { apiClient, type PaginatedResponse } from './client';
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
  proofFileId?: string;
}

export type UndergradDegreeType = 'bacharelado' | 'licenciatura' | 'tecnologo';

export interface Enrollment {
  id: string;
  candidateId: string;
  enrollmentPeriodId: string;
  level: string;
  status: string;
  undergradUniversity: string | null;
  undergradCourse: string | null;
  undergradDegreeType: UndergradDegreeType | null;
  ira: string | null;
  undergradProofFileId: string | null;
  phone: string | null;
  justification: string | null;
  sigaaCode: string | null;
  sigaaReceiptFileId: string | null;
  declaration: boolean | null;
  primaryThemeId: string | null;
  secondaryThemeId: string | null;
  poscomp: PoscompData | null;
  mastersDegrees: MastersDegreeData[] | null;
  projectTitle: string | null;
  projectFileId: string | null;
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
  undergradUniversity?: string;
  undergradCourse?: string;
  undergradDegreeType?: UndergradDegreeType;
  ira?: string;
  projectTitle?: string;
  phone?: string;
  justification?: string;
  sigaaCode?: string;
  declaration?: boolean;
  poscomp?: PoscompData;
}

export interface UpdateMastersDegreesPayload {
  mastersDegrees: MastersDegreeData[];
}

export interface UpdateEnrollmentThemesPayload {
  primaryThemeId: string;
  secondaryThemeId?: string | null;
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
    undergradUniversity: asNullableString(r.undergradUniversity),
    undergradCourse: asNullableString(r.undergradCourse),
    undergradDegreeType:
      (asNullableString(r.undergradDegreeType) as UndergradDegreeType | null) ?? null,
    ira: asNullableString(r.ira),
    undergradProofFileId: asNullableString(r.undergradProofFileId),
    phone: asNullableString(r.phone),
    justification: asNullableString(r.justification),
    sigaaCode: asNullableString(r.sigaaCode),
    sigaaReceiptFileId: asNullableString(r.sigaaReceiptFileId),
    declaration: r.declaration != null ? Boolean(r.declaration) : null,
    primaryThemeId: asNullableString(r.primaryThemeId),
    secondaryThemeId: asNullableString(r.secondaryThemeId),
    poscomp: (r.poscomp as PoscompData | null) ?? null,
    mastersDegrees: (r.mastersDegrees as MastersDegreeData[] | null) ?? null,
    projectTitle: asNullableString(r.projectTitle),
    projectFileId: asNullableString(r.projectFileId),
    scoreDraft: asNullableString(r.scoreDraft),
    submittedAt: asNullableString(r.submittedAt),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── File helpers ─────────────────────────────────────────────────────

interface FileInfo {
  url: string;
  fileName: string;
}

/** POST a single multipart file and return the refreshed enrollment. */
async function postEnrollmentFile(path: string, file: File): Promise<Enrollment> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return normalizeEnrollment(data);
}

/** GET the signed url + filename for a stored enrollment file. */
async function getFileInfo(path: string): Promise<FileInfo> {
  const { data } = await apiClient.get(path);
  const r = data as Record<string, unknown>;
  return { url: asString(r.url), fileName: asString(r.fileName) };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const enrollmentsApi = {
  findAll: async (params?: {
    page?: number;
    limit?: number;
    candidateId?: string;
    enrollmentPeriodId?: string;
    status?: string;
    level?: string;
  }): Promise<PaginatedResponse<Enrollment>> => {
    const res = await apiClient.get('/enrollments', { params });
    const r = asRecord(res.data);
    const m = asRecord(r.pagination || {});
    return {
      data: Array.isArray(r.data) ? r.data.map(normalizeEnrollment) : [],
      pagination: {
        page: Number(m.page) || 1,
        limit: Number(m.limit) || 20,
        total: Number(m.total) || 0,
        totalPages: Number(m.totalPages) || 1,
      },
    };
  },

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

  updateThemes: async (id: string, payload: UpdateEnrollmentThemesPayload): Promise<Enrollment> => {
    return normalizeEnrollment((await apiClient.put(`/enrollments/${id}/themes`, payload)).data);
  },

  getMastersDegrees: async (id: string): Promise<MastersDegreeData[] | null> => {
    const { data } = await apiClient.get(`/enrollments/${id}/masters-degrees`);
    return (data as MastersDegreeData[] | null) ?? null;
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/enrollments/${id}`);
  },

  uploadSigaaReceipt: (id: string, file: File): Promise<Enrollment> =>
    postEnrollmentFile(`/enrollments/${id}/sigaa-receipt`, file),

  getSigaaReceiptInfo: (id: string): Promise<FileInfo> =>
    getFileInfo(`/enrollments/${id}/sigaa-receipt`),

  uploadPoscompReceipt: (id: string, file: File): Promise<Enrollment> =>
    postEnrollmentFile(`/enrollments/${id}/poscomp-receipt`, file),

  getPoscompReceiptInfo: (id: string): Promise<FileInfo> =>
    getFileInfo(`/enrollments/${id}/poscomp-receipt`),

  uploadUndergradProof: (id: string, file: File): Promise<Enrollment> =>
    postEnrollmentFile(`/enrollments/${id}/undergrad-proof`, file),

  getUndergradProofInfo: (id: string): Promise<FileInfo> =>
    getFileInfo(`/enrollments/${id}/undergrad-proof`),

  uploadProjectFile: (id: string, file: File): Promise<Enrollment> =>
    postEnrollmentFile(`/enrollments/${id}/project-file`, file),

  getProjectFileInfo: (id: string): Promise<FileInfo> =>
    getFileInfo(`/enrollments/${id}/project-file`),

  uploadMastersDegreeProof: (id: string, index: number, file: File): Promise<Enrollment> =>
    postEnrollmentFile(`/enrollments/${id}/masters-degrees/${index}/proof`, file),

  getMastersDegreeProofInfo: (id: string, index: number): Promise<FileInfo> =>
    getFileInfo(`/enrollments/${id}/masters-degrees/${index}/proof`),
};
