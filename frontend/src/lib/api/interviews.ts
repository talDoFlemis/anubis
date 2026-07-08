import { apiClient } from './client';

import { asNullableString, asRecord, asString } from './normalizers';

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

export interface InterviewEvaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  evaluatorName: string | null;
  decisionMaking: Concept;
  problemAnalysis: Concept;
  oralCommunication: Concept;
  researchWork: Concept;
  technicalKnowledge: Concept;
  observations: string | null;
  createdAt: string;
}

export interface ProjectEvaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  evaluatorName: string | null;
  criterion1: Concept;
  criterion2: Concept;
  criterion3: Concept;
  criterion4: Concept;
  criterion5: Concept;
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
}

// ── Normalizers ───────────────────────────────────────────────────────

function normalizeInterviewEvaluation(data: unknown): InterviewEvaluation {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    candidateId: asString(r.candidateId),
    evaluatorId: asString(r.evaluatorId),
    evaluatorName: asNullableString(r.evaluatorName),
    decisionMaking: asString(r.decisionMaking) as Concept,
    problemAnalysis: asString(r.problemAnalysis) as Concept,
    oralCommunication: asString(r.oralCommunication) as Concept,
    researchWork: asString(r.researchWork) as Concept,
    technicalKnowledge: asString(r.technicalKnowledge) as Concept,
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
    criterion1: asString(r.criterion1) as Concept,
    criterion2: asString(r.criterion2) as Concept,
    criterion3: asString(r.criterion3) as Concept,
    criterion4: asString(r.criterion4) as Concept,
    criterion5: asString(r.criterion5) as Concept,
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
      decisionMaking: Concept;
      problemAnalysis: Concept;
      oralCommunication: Concept;
      researchWork: Concept;
      technicalKnowledge: Concept;
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
      criterion1: Concept;
      criterion2: Concept;
      criterion3: Concept;
      criterion4: Concept;
      criterion5: Concept;
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
