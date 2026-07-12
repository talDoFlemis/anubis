import { apiClient } from './client';

import { asNullableString, asNumber, asRecord, asString } from './normalizers';

// ── Types ─────────────────────────────────────────────────────────────

export type Concept = 'FRACO' | 'REGULAR' | 'BOM' | 'OTIMO';

export const CONCEPT_SCORE: Record<Concept, number> = {
  FRACO: 4,
  REGULAR: 6,
  BOM: 8,
  OTIMO: 10,
};

export const CONCEPT_LABELS: Record<Concept, string> = {
  FRACO: 'Fraco',
  REGULAR: 'Regular',
  BOM: 'Bom',
  OTIMO: 'Ótimo',
};

export function scoreToConcept(score: number): Concept {
  if (score >= 8) return 'OTIMO';
  if (score >= 6) return 'BOM';
  if (score >= 4) return 'REGULAR';
  return 'FRACO';
}

export interface InterviewEvaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  evaluatorName: string | null;
  decisionMaking: number;
  problemAnalysis: number;
  oralCommunication: number;
  researchWork: number;
  technicalKnowledge: number;
  observations: string | null;
  createdAt: string;
}

export interface ProjectEvaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  evaluatorName: string | null;
  criterion1: number;
  criterion2: number;
  criterion3: number;
  criterion4: number;
  criterion5: number;
  observations: string | null;
  createdAt: string;
}

export interface InterviewAverages {
  perAspect: {
    decisionMaking: number;
    problemAnalysis: number;
    oralCommunication: number;
    researchWork: number;
    technicalKnowledge: number;
  };
  overall: number;
  perAspectConcepts?: Record<string, { score: number; concept: Concept; label: string }>;
}

export interface ProjectAverages {
  perAspect: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  overall: number;
  perAspectConcepts?: Record<string, { score: number; concept: Concept; label: string }>;
}

// ── Normalizers ───────────────────────────────────────────────────────

function normalizeInterviewEvaluation(data: unknown): InterviewEvaluation {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    candidateId: asString(r.candidateId),
    evaluatorId: asString(r.evaluatorId),
    evaluatorName: asNullableString(r.evaluatorName),
    decisionMaking: asNumber(r.decisionMaking),
    problemAnalysis: asNumber(r.problemAnalysis),
    oralCommunication: asNumber(r.oralCommunication),
    researchWork: asNumber(r.researchWork),
    technicalKnowledge: asNumber(r.technicalKnowledge),
    observations: asNullableString(r.observations),
    createdAt: asString(r.createdAt),
  };
}

function normalizeProjectEvaluation(data: unknown): ProjectEvaluation {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    candidateId: asString(r.candidateId),
    evaluatorId: asString(r.evaluatorId),
    evaluatorName: asNullableString(r.evaluatorName),
    criterion1: asNumber(r.criterion1),
    criterion2: asNumber(r.criterion2),
    criterion3: asNumber(r.criterion3),
    criterion4: asNumber(r.criterion4),
    criterion5: asNumber(r.criterion5),
    observations: asNullableString(r.observations),
    createdAt: asString(r.createdAt),
  };
}

// ── Endpoints ─────────────────────────────────────────────────────────

export const interviewsApi = {
  // ── Interview evaluations ───────────────────────────────────────────

  createEvaluation: async (
    candidateId: string,
    data: {
      decisionMaking: number;
      problemAnalysis: number;
      oralCommunication: number;
      researchWork: number;
      technicalKnowledge: number;
      observations?: string;
    },
  ): Promise<InterviewEvaluation> => {
    const res = await apiClient.post(`/interview/${candidateId}/evaluation`, data);
    return normalizeInterviewEvaluation(res.data);
  },

  getEvaluationsByCandidate: async (candidateId: string): Promise<InterviewEvaluation[]> => {
    const res = await apiClient.get(`/interview/${candidateId}/evaluations`);
    return (res.data as unknown[]).map(normalizeInterviewEvaluation);
  },

  getInterviewAverage: async (candidateId: string): Promise<InterviewAverages | null> => {
    const res = await apiClient.get(`/interview/${candidateId}/average`);
    return res.data ?? null;
  },

  // ── Project evaluations (Doutorado) ─────────────────────────────────

  createProjectEvaluation: async (
    candidateId: string,
    data: {
      criterion1: number;
      criterion2: number;
      criterion3: number;
      criterion4: number;
      criterion5: number;
      observations?: string;
    },
  ): Promise<ProjectEvaluation> => {
    const res = await apiClient.post(`/interview/${candidateId}/project-evaluation`, data);
    return normalizeProjectEvaluation(res.data);
  },

  getProjectEvaluationsByCandidate: async (candidateId: string): Promise<ProjectEvaluation[]> => {
    const res = await apiClient.get(`/interview/${candidateId}/project-evaluations`);
    return (res.data as unknown[]).map(normalizeProjectEvaluation);
  },

  getProjectAverage: async (candidateId: string): Promise<ProjectAverages | null> => {
    const res = await apiClient.get(`/interview/${candidateId}/project-average`);
    return res.data ?? null;
  },
};
