import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDebounce } from '@/hooks/use-debounce';
import { useState } from 'react';

// ── University Search ────────────────────────────────────────────────

export function useUniversitySearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['universities', 'search', debouncedQuery],
    queryFn: () => api.universities.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  return { query, setQuery, results, isLoading };
}

// ── Course Search ────────────────────────────────────────────────────

export function useCourseSearch(universityId?: string, initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['courses', 'search', debouncedQuery, universityId],
    queryFn: () => api.universities.searchCourses(debouncedQuery, universityId),
    enabled: debouncedQuery.length >= 2,
  });

  return { query, setQuery, results, isLoading };
}

// ── Manual Entry Mutations ───────────────────────────────────────────

export function useCreateUniversity() {
  return useMutation({
    mutationFn: api.universities.create,
  });
}

export function useCreateCourse() {
  return useMutation({
    mutationFn: api.universities.createCourse,
  });
}

// ── Professor Management Hooks ───────────────────────────────────────

export function usePendingUniversities() {
  return useQuery({
    queryKey: ['universities', 'pending'],
    queryFn: () => api.universities.getPending(),
  });
}

export function useSetUniversityGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mecGrade }: { id: string; mecGrade: number }) =>
      api.universities.setGrade(id, mecGrade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useSetUniversityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'invalidated' }) =>
      api.universities.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useSimilarUniversities(id: string) {
  return useQuery({
    queryKey: ['universities', id, 'similar'],
    queryFn: () => api.universities.getSimilar(id),
    enabled: !!id,
  });
}

export function useMergeUniversities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetId }: { id: string; targetId: string }) =>
      api.universities.merge(id, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function usePendingCourses() {
  return useQuery({
    queryKey: ['courses', 'pending'],
    queryFn: () => api.universities.getPendingCourses(),
  });
}

export function useSetCourseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'invalidated' }) =>
      api.universities.setCourseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useSimilarCourses(id: string) {
  return useQuery({
    queryKey: ['courses', id, 'similar'],
    queryFn: () => api.universities.getSimilarCourses(id),
    enabled: !!id,
  });
}

export function useMergeCourses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetId }: { id: string; targetId: string }) =>
      api.universities.mergeCourses(id, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
