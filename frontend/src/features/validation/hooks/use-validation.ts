import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { validationApi } from '@/lib/api/validation';

import type { CandidateValidationSummary, ValidationStatus } from '@/lib/api/validation';

export type { CandidateValidationSummary, ValidationStatus };

// ── Types ────────────────────────────────────────────────────────────

export interface UseValidationCandidatesOptions {
  page: number;
  limit: number;
  search: string;
}

export interface UseSecretaryCandidatesOptions extends UseValidationCandidatesOptions {
  level: string;
  status: string;
  professor: string;
}

// ── Query Options ────────────────────────────────────────────────────

export function validationCandidatesQueryOptions(options: UseValidationCandidatesOptions) {
  return queryOptions({
    queryKey: ['validation', 'candidates', options],
    queryFn: () => validationApi.findCandidates(options),
    staleTime: 2 * 60 * 1000,
  });
}

export function secretaryCandidatesQueryOptions(options: UseSecretaryCandidatesOptions) {
  return queryOptions({
    queryKey: ['validation', 'secretary', 'candidates', options],
    queryFn: () => validationApi.findCandidates(options),
    staleTime: 2 * 60 * 1000,
  });
}

export function secretaryStatsQueryOptions() {
  return queryOptions({
    queryKey: ['validation', 'secretary', 'stats'],
    queryFn: () => validationApi.getSecretaryStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function validationDetailsQueryOptions(enrollmentId: string) {
  return queryOptions({
    queryKey: ['validation', 'enrollment', enrollmentId],
    queryFn: () => validationApi.getDetails(enrollmentId),
    enabled: !!enrollmentId,
  });
}

// ── Hooks ────────────────────────────────────────────────────────────

export function useValidationCandidates(options: UseValidationCandidatesOptions) {
  return useQuery(validationCandidatesQueryOptions(options));
}

export function useSecretaryCandidates(options: UseSecretaryCandidatesOptions) {
  return useQuery(secretaryCandidatesQueryOptions(options));
}

export function useSecretaryStats() {
  return useQuery(secretaryStatsQueryOptions());
}

export function useValidationDetails(enrollmentId: string) {
  return useQuery(validationDetailsQueryOptions(enrollmentId));
}

export function useUpdateValidationScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      itemId,
      status,
      adjustedScore,
      justification,
    }: {
      enrollmentId: string;
      itemId: string;
      status: 'accepted' | 'partial' | 'rejected';
      adjustedScore?: number;
      justification?: string;
    }) => validationApi.updateScore(enrollmentId, itemId, { status, adjustedScore, justification }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['validation', 'enrollment', variables.enrollmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['validation', 'candidates'] });
      queryClient.invalidateQueries({ queryKey: ['validation', 'secretary'] });
      queryClient.invalidateQueries({ queryKey: ['cv-items', variables.enrollmentId] });
    },
  });
}
