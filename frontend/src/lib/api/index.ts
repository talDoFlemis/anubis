export { authApi } from './auth';
export { candidatesApi } from './candidates';
export { apiClient, ApiError, type PaginatedResponse } from './client';

export type {
  CandidateOnboardingData,
  EmailRegisterData,
  LoginResponse,
  ProfessorOnboardingData,
  UpdateUserData,
  User,
} from './auth';

export type { CandidateProfile } from './candidates';
export type { InviteProfessorPayload, PaginatedProfessors, ProfessorItem } from './professors';
export type {
  CreateResearchThemeOnBehalfPayload,
  CreateResearchThemePayload,
  PaginatedResearchThemes,
  ResearchTheme,
  ResearchThemeProfessor,
  ResearchThemeReference,
  UpdateResearchThemePayload,
} from './research-themes';

/**
 * Composed API object that mirrors the original `api` shape.
 *
 * Usage: `import { api } from '@/lib/api'`
 */
export { authApi as auth } from './auth';
export { candidatesApi as candidates } from './candidates';
export { professorsApi as professors } from './professors';
export { researchThemesApi as researchThemes } from './research-themes';

// Re-compose the legacy `api` namespace so existing `api.auth.*` calls keep working.
import { authApi } from './auth';
import { candidatesApi } from './candidates';
import { professorsApi } from './professors';
import { researchThemesApi } from './research-themes';

export const api = {
  auth: authApi,
  candidates: candidatesApi,
  professors: professorsApi,
  researchThemes: researchThemesApi,
} as const;
