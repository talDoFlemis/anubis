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
  mecGrade: number | null;
  status: 'pending' | 'approved' | 'invalidated';
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
  status: 'pending' | 'approved' | 'invalidated';
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
    mecGrade: r.mecGrade !== undefined && r.mecGrade !== null ? Number(r.mecGrade) : null,
    status: (r.status ? asString(r.status) : 'pending') as 'pending' | 'approved' | 'invalidated',
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
    status: (r.status ? asString(r.status) : 'pending') as 'pending' | 'approved' | 'invalidated',
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

  getPending: async (): Promise<University[]> => {
    const { data } = await apiClient.get('/universities/pending');
    return (data as unknown[]).map(normalizeUniversity);
  },

  setGrade: async (id: string, mecGrade: number): Promise<University> => {
    return normalizeUniversity(
      (await apiClient.patch(`/universities/${id}/grade`, { mecGrade })).data,
    );
  },

  setStatus: async (id: string, status: 'approved' | 'invalidated'): Promise<University> => {
    return normalizeUniversity(
      (await apiClient.patch(`/universities/${id}/status`, { status })).data,
    );
  },

  getSimilar: async (id: string): Promise<University[]> => {
    const { data } = await apiClient.get(`/universities/${id}/similar`);
    return (data as unknown[]).map(normalizeUniversity);
  },

  merge: async (id: string, targetId: string): Promise<void> => {
    await apiClient.post(`/universities/${id}/merge`, { targetId });
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

  findCourseById: async (id: string): Promise<Course> => {
    return normalizeCourse((await apiClient.get(`/courses/${id}`)).data);
  },

  createCourse: async (payload: CreateCoursePayload): Promise<Course> => {
    return normalizeCourse((await apiClient.post('/courses', payload)).data);
  },

  getPendingCourses: async (): Promise<Course[]> => {
    const { data } = await apiClient.get('/courses/pending');
    return (data as unknown[]).map(normalizeCourse);
  },

  setCourseStatus: async (id: string, status: 'approved' | 'invalidated'): Promise<Course> => {
    return normalizeCourse((await apiClient.patch(`/courses/${id}/status`, { status })).data);
  },

  getSimilarCourses: async (id: string): Promise<Course[]> => {
    const { data } = await apiClient.get(`/courses/${id}/similar`);
    return (data as unknown[]).map(normalizeCourse);
  },

  mergeCourses: async (id: string, targetId: string): Promise<void> => {
    await apiClient.post(`/courses/${id}/merge`, { targetId });
  },
};
