import { apiClient } from './client';
import { asBool, asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  cpf: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
}

export interface EmailRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cpf: string;
  universityOfOrigin: string;
  ira: string;
}

export interface CandidateOnboardingData {
  firstName: string;
  lastName: string;
  cpf: string;
  universityOfOrigin: string;
  ira: string;
  poscomp?: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  cpf?: string;
  password?: string;
  oldPassword?: string;
}

export interface ProfessorOnboardingData {
  hash: string;
  password: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeUser(data: unknown): User {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    email: asNullableString(r.email),
    cpf: asNullableString(r.cpf),
    firstName: asNullableString(r.firstName),
    lastName: asNullableString(r.lastName),
    role: asString(r.role),
    status: asString(r.status),
    onboardingCompleted: asBool(r.onboardingCompleted),
    mustChangePassword: asBool(r.mustChangePassword),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

function normalizeLoginResponse(data: unknown): LoginResponse {
  const r = asRecord(data);
  return {
    userId: asString(r.userId),
    email: asNullableString(r.email),
    firstName: asNullableString(r.firstName),
    lastName: asNullableString(r.lastName),
    role: asString(r.role),
    status: asString(r.status),
    onboardingCompleted: asBool(r.onboardingCompleted),
    mustChangePassword: asBool(r.mustChangePassword),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const authApi = {
  me: async () => normalizeUser((await apiClient.get('/auth/me')).data),

  emailLogin: (data: { email: string; password: string }) =>
    apiClient
      .post('/auth/provider/email/login', data)
      .then(res => normalizeLoginResponse(res.data)),

  emailRegister: (data: EmailRegisterData) =>
    apiClient.post<void>('/auth/provider/email/register', data).then(res => res.data),

  googleLogin: (data: { idToken: string }) =>
    apiClient.post('/auth/provider/google', data).then(res => normalizeLoginResponse(res.data)),

  completeCandidateOnboarding: (data: CandidateOnboardingData) =>
    apiClient.post('/auth/onboarding/candidate', data).then(res => normalizeUser(res.data)),

  completeProfessorOnboarding: (data: ProfessorOnboardingData) =>
    apiClient.post<void>('/auth/provider/email/onboarding/professor', data).then(res => res.data),

  verifyOnboardingToken: (data: { hash: string }) =>
    apiClient.post<void>('/auth/provider/email/onboarding/verify', data).then(res => res.data),

  completeGoogleOnboarding: (data: { hash: string; idToken: string }) =>
    apiClient.post<void>('/auth/provider/email/onboarding/google', data).then(res => res.data),

  resendProfessorOnboarding: (data: { email: string }) =>
    apiClient
      .post<void>('/auth/provider/email/onboarding/professor/resend', data)
      .then(res => res.data),

  confirmEmail: (data: { hash: string }) =>
    apiClient.post<void>('/auth/provider/email/confirm', data).then(res => res.data),

  confirmNewEmail: (data: { hash: string }) =>
    apiClient.post<void>('/auth/provider/email/confirm/new', data).then(res => res.data),

  forgotPassword: (data: { email: string }) =>
    apiClient.post<void>('/auth/provider/email/forgot/password', data).then(res => res.data),

  resetPassword: (data: { hash: string; password: string }) =>
    apiClient.post<void>('/auth/provider/email/reset/password', data).then(res => res.data),

  update: (data: UpdateUserData) =>
    apiClient.patch('/auth/me', data).then(res => normalizeUser(res.data)),

  logout: () => apiClient.post<void>('/auth/logout').then(res => res.data),

  deleteAccount: () => apiClient.delete<void>('/auth/me').then(res => res.data),
};
