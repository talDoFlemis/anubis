import type { CreateCvItemPayload, UpdateCvItemPayload } from '@/lib/api';
import { api } from '@/lib/api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Pontuação base do currículo, somada antes das categorias.
 * Mantém paridade com o backend (cv-scoring-config BASE_CV_SCORE).
 */
export const BASE_CV_SCORE = 6;

// ── Query Options ────────────────────────────────────────────────────

export function scoringCategoriesQueryOptions(periodId: string, level: string) {
  return queryOptions({
    queryKey: ['scoring-categories', periodId, level],
    queryFn: () => api.cvScoring.findCategories(periodId, level),
    enabled: !!periodId && !!level,
    staleTime: 10 * 60 * 1000,
  });
}

export function cvItemsQueryOptions(enrollmentId: string) {
  return queryOptions({
    queryKey: ['cv-items', enrollmentId],
    queryFn: () => api.cvItems.findByEnrollment(enrollmentId),
    enabled: !!enrollmentId,
  });
}

// ── Hooks ────────────────────────────────────────────────────────────

export function useScoringCategories(periodId: string, level: string) {
  return useQuery(scoringCategoriesQueryOptions(periodId, level));
}

export function useCvItems(enrollmentId: string) {
  return useQuery(cvItemsQueryOptions(enrollmentId));
}

export function useCreateCvItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      payload,
      file,
    }: {
      enrollmentId: string;
      payload: CreateCvItemPayload;
      file?: File;
    }) => api.cvItems.create(enrollmentId, payload, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cv-items', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
    },
  });
}

export function useUpdateCvItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      itemId,
      payload,
      file,
    }: {
      enrollmentId: string;
      itemId: string;
      payload: UpdateCvItemPayload;
      file?: File;
    }) => api.cvItems.update(enrollmentId, itemId, payload, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cv-items', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.enrollmentId] });
    },
  });
}

export function useRemoveCvItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, itemId }: { enrollmentId: string; itemId: string }) =>
      api.cvItems.remove(enrollmentId, itemId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cv-items', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
    },
  });
}

export function useCvItemFileUrl(enrollmentId: string, itemId: string) {
  return useQuery({
    queryKey: ['cv-items', enrollmentId, itemId, 'file-url'],
    queryFn: () => api.cvItems.getFileUrl(enrollmentId, itemId),
    enabled: !!enrollmentId && !!itemId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useVerifyCvItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      itemId,
      payload,
    }: {
      enrollmentId: string;
      itemId: string;
      payload: {
        isVerified: 'verified' | 'incorrect';
        correctedClassification?: string;
        verificationComment?: string;
      };
    }) => api.cvItems.verify(enrollmentId, itemId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cv-items', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['validation'] });
    },
  });
}
