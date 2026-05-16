import { apiClient } from './client';
import { asBool, asNullableNumber, asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface CandidateProfile {
  userId: string;
  email: string | null;
  cpf: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  universityOfOrigin: string;
  ira: string | null;
  poscomp: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeCandidateProfile(data: unknown): CandidateProfile {
  const r = asRecord(data);
  return {
    userId: asString(r.userId),
    email: asNullableString(r.email),
    cpf: asNullableString(r.cpf),
    firstName: asNullableString(r.firstName),
    lastName: asNullableString(r.lastName),
    role: asString(r.role),
    status: asString(r.status),
    onboardingCompleted: asBool(r.onboardingCompleted),
    universityOfOrigin: asString(r.universityOfOrigin),
    ira: asNullableString(r.ira),
    poscomp: asNullableNumber(r.poscomp),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const candidatesApi = {
  me: async () => normalizeCandidateProfile((await apiClient.get('/candidates/me')).data),
};
