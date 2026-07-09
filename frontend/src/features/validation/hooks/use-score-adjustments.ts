import type { CreateScoreAdjustmentPayload } from '@/lib/api';
import { api } from '@/lib/api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function scoreAdjustmentsQueryOptions(enrollmentId: string) {
  return queryOptions({
    queryKey: ['enrollments', enrollmentId, 'score-adjustments'],
    queryFn: () => api.enrollments.getScoreAdjustments(enrollmentId),
    enabled: !!enrollmentId,
  });
}

export function useScoreAdjustments(enrollmentId: string) {
  return useQuery(scoreAdjustmentsQueryOptions(enrollmentId));
}

export function useCreateScoreAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      payload,
    }: {
      enrollmentId: string;
      payload: CreateScoreAdjustmentPayload;
    }) => api.enrollments.createScoreAdjustment(enrollmentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollments', variables.enrollmentId, 'score-adjustments'],
      });
      // Also invalidate validation details so overall scores refresh on screen
      queryClient.invalidateQueries({
        queryKey: ['validation', 'enrollment', variables.enrollmentId],
      });
    },
  });
}

export function useDeleteScoreAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      scoreType,
    }: {
      enrollmentId: string;
      scoreType: 'cv_score' | 'ira' | 'final';
    }) => api.enrollments.deleteScoreAdjustment(enrollmentId, scoreType),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollments', variables.enrollmentId, 'score-adjustments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['validation', 'enrollment', variables.enrollmentId],
      });
    },
  });
}

export function useLockScoreAdjustments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string) => api.enrollments.lockScoreAdjustments(enrollmentId),
    onSuccess: (_data, enrollmentId) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollments', enrollmentId, 'score-adjustments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['validation', 'enrollment', enrollmentId],
      });
    },
  });
}
