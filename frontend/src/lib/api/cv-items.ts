import { apiClient } from './client';
import { asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export type VerificationStatus = 'pending' | 'accepted' | 'partial' | 'rejected';

export interface CvItem {
  id: string;
  enrollmentId: string;
  scoringCategoryId: string;
  description: string;
  quantity: number;
  proofFileId: string | null;
  proofFileName: string | null;
  score: string | null;
  classification: string | null;
  isComplete: boolean;
  isResumo: boolean;
  isPeriodico: boolean;
  isAutorPrincipal: boolean;
  isDissertacao: boolean;
  isEncontroIc: boolean;
  isInArea: boolean;
  docenciaType: string | null;
  eventoType: string | null;
  verificationStatus: VerificationStatus;
  adjustedScore: string | null;
  verificationJustification: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  correctedClassification: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyCvItemPayload {
  status: 'accepted' | 'partial' | 'rejected';
  adjustedScore?: number;
  justification?: string;
}

export interface CreateCvItemPayload {
  scoringCategoryId: string;
  description: string;
  quantity?: number;
  classification?: string | null;
  isComplete?: boolean;
  isResumo?: boolean;
  isPeriodico?: boolean;
  isAutorPrincipal?: boolean;
  isDissertacao?: boolean;
  isEncontroIc?: boolean;
  isInArea?: boolean;
  docenciaType?: string | null;
  eventoType?: string | null;
}

export interface UpdateCvItemPayload {
  scoringCategoryId?: string;
  description?: string;
  quantity?: number;
  classification?: string | null;
  isComplete?: boolean;
  isResumo?: boolean;
  isPeriodico?: boolean;
  isAutorPrincipal?: boolean;
  isDissertacao?: boolean;
  isEncontroIc?: boolean;
  isInArea?: boolean;
  docenciaType?: string | null;
  eventoType?: string | null;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeCvItem(data: unknown): CvItem {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    enrollmentId: asString(r.enrollmentId),
    scoringCategoryId: asString(r.scoringCategoryId),
    description: asString(r.description),
    quantity: typeof r.quantity === 'number' ? r.quantity : 1,
    proofFileId: asNullableString(r.proofFileId),
    proofFileName: asNullableString(r.proofFileName),
    score: asNullableString(r.score),
    classification: asNullableString(r.classification),
    isComplete: !!r.isComplete,
    isResumo: !!r.isResumo,
    isPeriodico: !!r.isPeriodico,
    isAutorPrincipal: !!r.isAutorPrincipal,
    isDissertacao: !!r.isDissertacao,
    isEncontroIc: !!r.isEncontroIc,
    isInArea: !!r.isInArea,
    docenciaType: asNullableString(r.docenciaType),
    eventoType: asNullableString(r.eventoType),
    verificationStatus: (asString(r.verificationStatus || r.isVerified || 'pending') as CvItem['verificationStatus']),
    adjustedScore: asNullableString(r.adjustedScore),
    verificationJustification: asNullableString(r.verificationJustification || r.verificationComment),
    verifiedBy: asNullableString(r.verifiedBy),
    verifiedAt: asNullableString(r.verifiedAt),
    correctedClassification: asNullableString(r.correctedClassification),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function buildFormData(payload: CreateCvItemPayload | UpdateCvItemPayload, file?: File): FormData {
  const formData = new FormData();
  if ('scoringCategoryId' in payload && payload.scoringCategoryId) {
    formData.append('scoringCategoryId', payload.scoringCategoryId);
  }
  if ('description' in payload && payload.description) {
    formData.append('description', payload.description);
  }
  if (payload.quantity != null) {
    formData.append('quantity', String(payload.quantity));
  }
  if (payload.classification !== undefined) {
    formData.append('classification', payload.classification || '');
  }
  if (payload.isComplete !== undefined) {
    formData.append('isComplete', String(payload.isComplete));
  }
  if (payload.isResumo !== undefined) {
    formData.append('isResumo', String(payload.isResumo));
  }
  if (payload.isPeriodico !== undefined) {
    formData.append('isPeriodico', String(payload.isPeriodico));
  }
  if (payload.isAutorPrincipal !== undefined) {
    formData.append('isAutorPrincipal', String(payload.isAutorPrincipal));
  }
  if (payload.isDissertacao !== undefined) {
    formData.append('isDissertacao', String(payload.isDissertacao));
  }
  if (payload.isEncontroIc !== undefined) {
    formData.append('isEncontroIc', String(payload.isEncontroIc));
  }
  if (payload.isInArea !== undefined) {
    formData.append('isInArea', String(payload.isInArea));
  }
  if (payload.docenciaType !== undefined) {
    formData.append('docenciaType', payload.docenciaType || '');
  }
  if (payload.eventoType !== undefined) {
    formData.append('eventoType', payload.eventoType || '');
  }

  if (file) {
    formData.append('file', file);
  }
  return formData;
}

// ── Endpoints ────────────────────────────────────────────────────────

export const cvItemsApi = {
  findByEnrollment: async (enrollmentId: string): Promise<CvItem[]> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/cv-items`);
    return (data as unknown[]).map(normalizeCvItem);
  },

  create: async (
    enrollmentId: string,
    payload: CreateCvItemPayload,
    file?: File,
  ): Promise<CvItem> => {
    const formData = buildFormData(payload, file);
    return normalizeCvItem(
      (
        await apiClient.post(`/enrollments/${enrollmentId}/cv-items`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data,
    );
  },

  update: async (
    enrollmentId: string,
    itemId: string,
    payload: UpdateCvItemPayload,
    file?: File,
  ): Promise<CvItem> => {
    const formData = buildFormData(payload, file);
    return normalizeCvItem(
      (
        await apiClient.patch(`/enrollments/${enrollmentId}/cv-items/${itemId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data,
    );
  },

  verify: async (
    enrollmentId: string,
    itemId: string,
    payload: VerifyCvItemPayload,
  ): Promise<CvItem> => {
    const { data } = await apiClient.patch(
      `/enrollments/${enrollmentId}/cv-items/${itemId}/verify`,
      payload,
    );
    return normalizeCvItem(data);
  },

  remove: async (enrollmentId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/enrollments/${enrollmentId}/cv-items/${itemId}`);
  },

  getFileUrl: async (enrollmentId: string, itemId: string): Promise<string> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/cv-items/${itemId}/file`);
    return asString((data as Record<string, unknown>).url);
  },
};
