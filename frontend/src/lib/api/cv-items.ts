import { apiClient } from './client';
import { asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface CvItem {
  id: string;
  enrollmentId: string;
  scoringCategoryId: string;
  description: string;
  quantity: number;
  isInArea: boolean | null;
  proofFileId: string | null;
  score: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCvItemPayload {
  scoringCategoryId: string;
  description: string;
  quantity?: number;
  isInArea?: boolean;
}

export interface UpdateCvItemPayload {
  scoringCategoryId?: string;
  description?: string;
  quantity?: number;
  isInArea?: boolean;
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
    isInArea: r.isInArea != null ? Boolean(r.isInArea) : null,
    proofFileId: asNullableString(r.proofFileId),
    score: asNullableString(r.score),
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
  if (payload.isInArea != null) {
    formData.append('isInArea', String(payload.isInArea));
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

  remove: async (enrollmentId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/enrollments/${enrollmentId}/cv-items/${itemId}`);
  },

  getFileUrl: async (enrollmentId: string, itemId: string): Promise<string> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/cv-items/${itemId}/file`);
    return asString((data as Record<string, unknown>).url);
  },
};
