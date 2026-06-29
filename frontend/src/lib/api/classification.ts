import { apiClient } from './client';
import { asNullableNumber, asNullableString, asRecord, asString } from './normalizers';

import { mockClassificationData } from '../mock-classification-data';

// ── Types ─────────────────────────────────────────────────────────────

export interface Classification {
  id: string;
  candidateId: string;
  researchThemeId: string;
  ira: string;
  cvScore: string;
  interviewScore: string;
  projectScore: string | null;
  finalScore: string;
  rank: number;
  stage: 'mestrado' | 'doutorado';
  createdAt: string;
  updatedAt: string;
}

// ── API ───────────────────────────────────────────────────────────────

export const classification = {
  triggerClassification: async (params?: {
    researchThemeId?: string | null;
    stage?: 'mestrado' | 'doutorado' | null;
  }): Promise<Classification[]> => {
    const response = await apiClient.post('/classification/trigger', params);
    // Normalize each item in the array
    return response.data.map((item: unknown) => {
      const record = asRecord(item);
      return {
        id: asString(record.id),
        candidateId: asString(record.candidateId),
        researchThemeId: asString(record.researchThemeId),
        ira: asString(record.ira),
        cvScore: asString(record.cvScore),
        interviewScore: asString(record.interviewScore),
        projectScore: asNullableString(record.projectScore),
        finalScore: asString(record.finalScore),
        rank: asNullableNumber(record.rank) ?? 0,
        stage:
          record.stage === 'mestrado' || record.stage === 'doutorado' ? record.stage : 'mestrado',
        createdAt: asString(record.createdAt),
        updatedAt: asString(record.updatedAt),
      };
    });
  },

  getRankingMocking: async (_params?: any): Promise<{ data: Classification[]; meta: any }> => {
    return {
      data: mockClassificationData,
      meta: { total: 2, page: 1, lastPage: 1 },
    };
  },

  getRanking: async (params?: {
    researchThemeId?: string | null;
    stage?: 'mestrado' | 'doutorado' | null;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Classification[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
    };
  }> => {
    const response = await apiClient.get('/classification/ranking', { params });
    // Normalize the data array and meta
    const data = response.data.data.map((item: unknown) => {
      const record = asRecord(item);
      return {
        id: asString(record.id),
        candidateId: asString(record.candidateId),
        researchThemeId: asString(record.researchThemeId),
        ira: asString(record.ira),
        cvScore: asString(record.cvScore),
        interviewScore: asString(record.interviewScore),
        projectScore: asNullableString(record.projectScore),
        finalScore: asString(record.finalScore),
        rank: asNullableNumber(record.rank) ?? 0,
        stage:
          record.stage === 'mestrado' || record.stage === 'doutorado' ? record.stage : 'mestrado',
        createdAt: asString(record.createdAt),
        updatedAt: asString(record.updatedAt),
      };
    });
    const meta = asRecord(response.data.meta);
    return {
      data,
      meta: {
        total: asNullableNumber(meta.total) ?? 0,
        page: asNullableNumber(meta.page) ?? 0,
        lastPage: asNullableNumber(meta.lastPage) ?? 0,
      },
    };
  },
};
