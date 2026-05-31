import { api } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';

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
