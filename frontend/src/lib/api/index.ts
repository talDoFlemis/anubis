export { ApiError, apiClient } from './client';
export { authApi } from './auth';
export { candidatesApi } from './candidates';

export type {
  User,
  LoginResponse,
  EmailRegisterData,
  CandidateOnboardingData,
  UpdateUserData,
  ProfessorOnboardingData,
} from './auth';

export type { CandidateProfile } from './candidates';

/**
 * Composed API object that mirrors the original `api` shape.
 *
 * Usage: `import { api } from '@/lib/api'`
 */
export { authApi as auth } from './auth';
export { candidatesApi as candidates } from './candidates';

// Re-compose the legacy `api` namespace so existing `api.auth.*` calls keep working.
import { authApi } from './auth';
import { candidatesApi } from './candidates';

export const api = {
  auth: authApi,
  candidates: candidatesApi,
} as const;
