export { authApi } from './auth';
export { candidatesApi } from './candidates';
export { apiClient, ApiError, type PaginatedResponse } from './client';
export { cvItemsApi } from './cv-items';
export { cvScoringApi } from './cv-scoring';
export { enrollmentPeriodsApi } from './enrollment-periods';
export { enrollmentsApi } from './enrollments';
export { interviewsApi } from './interviews';
export { universitiesApi } from './universities';
export { validationApi } from './validation';

export { classification } from './classification';

export type {
  CandidateOnboardingData,
  EmailRegisterData,
  LoginResponse,
  ProfessorOnboardingData,
  UpdateUserData,
  User,
} from './auth';

export type { CandidateProfile } from './candidates';
export type { CreateCvItemPayload, CvItem, UpdateCvItemPayload } from './cv-items';
export type { ScoringCategory } from './cv-scoring';
export type { CreateEnrollmentPeriodPayload, EnrollmentPeriod } from './enrollment-periods';
export type {
  CreateEnrollmentPayload,
  CreateScoreAdjustmentPayload,
  Enrollment,
  MastersDegreeData,
  PoscompData,
  ScoreAdjustment,
  UndergradDegreeType,
  UpdateEnrollmentPayload,
  UpdateEnrollmentThemesPayload,
  UpdateMastersDegreesPayload,
} from './enrollments';

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
export type {
  Course,
  CourseOption,
  CreateCoursePayload,
  CreateUniversityPayload,
  University,
  UniversityOption,
} from './universities';

export type { Classification } from './classification';
export type {
  Concept,
  InterviewAverages,
  InterviewEvaluation,
  ProjectAverages,
  ProjectEvaluation,
} from './interviews';

import { authApi } from './auth';
import { candidatesApi } from './candidates';
import { cvItemsApi } from './cv-items';
import { cvScoringApi } from './cv-scoring';
import { enrollmentPeriodsApi } from './enrollment-periods';
import { enrollmentsApi } from './enrollments';
import { interviewsApi } from './interviews';
import { professorsApi } from './professors';
import { researchThemesApi } from './research-themes';
import { universitiesApi } from './universities';
import { validationApi } from './validation';

import { classification } from './classification';

export const api = {
  auth: authApi,
  candidates: candidatesApi,
  cvItems: cvItemsApi,
  cvScoring: cvScoringApi,
  enrollmentPeriods: enrollmentPeriodsApi,
  enrollments: enrollmentsApi,
  interviews: interviewsApi,
  professors: professorsApi,
  researchThemes: researchThemesApi,
  universities: universitiesApi,
  validation: validationApi,
  classification: classification,
} as const;
