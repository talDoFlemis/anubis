import { apiClient } from './client';
import { asBool, asNullableString, asRecord, asString } from './normalizers';

// ── Types ────────────────────────────────────────────────────────────

export interface University {
  id: string;
  name: string;
  abbreviation: string | null;
  state: string | null;
  city: string | null;
  isManual: boolean;
  createdAt: string;
}

export interface UniversityOption {
  id: string;
  label: string;
}

export interface Course {
  id: string;
  name: string;
  universityId: string | null;
  isManual: boolean;
  createdAt: string;
}

export interface CourseOption {
  id: string;
  label: string;
}

export interface CreateUniversityPayload {
  name: string;
  abbreviation?: string;
  state?: string;
  city?: string;
}

export interface CreateCoursePayload {
  name: string;
  universityId?: string;
}

// ── Normalizers ──────────────────────────────────────────────────────

function normalizeUniversityOption(data: unknown): UniversityOption {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    label: asString(r.label),
  };
}

function normalizeCourseOption(data: unknown): CourseOption {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    label: asString(r.label),
  };
}

function normalizeUniversity(data: unknown): University {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    name: asString(r.name),
    abbreviation: asNullableString(r.abbreviation),
    state: asNullableString(r.state),
    city: asNullableString(r.city),
    isManual: asBool(r.isManual),
    createdAt: asString(r.createdAt),
  };
}

function normalizeCourse(data: unknown): Course {
  const r = asRecord(data);
  return {
    id: asString(r.id),
    name: asString(r.name),
    universityId: asNullableString(r.universityId),
    isManual: asBool(r.isManual),
    createdAt: asString(r.createdAt),
  };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const universitiesApi = {
  search: async (query: string, limit = 20): Promise<UniversityOption[]> => {
    const { data } = await apiClient.get('/universities', { params: { q: query, limit } });
    return (data as unknown[]).map(normalizeUniversityOption);
  },

  findById: async (id: string): Promise<University> => {
    return normalizeUniversity((await apiClient.get(`/universities/${id}`)).data);
  },

  create: async (payload: CreateUniversityPayload): Promise<University> => {
    return normalizeUniversity((await apiClient.post('/universities', payload)).data);
  },

  searchCourses: async (
    query: string,
    universityId?: string,
    limit = 20,
  ): Promise<CourseOption[]> => {
    const params: Record<string, string | number> = { q: query, limit };
    if (universityId) params.universityId = universityId;
    const { data } = await apiClient.get('/courses', { params });
    return (data as unknown[]).map(normalizeCourseOption);
  },

  createCourse: async (payload: CreateCoursePayload): Promise<Course> => {
    return normalizeCourse((await apiClient.post('/courses', payload)).data);
  },
};
