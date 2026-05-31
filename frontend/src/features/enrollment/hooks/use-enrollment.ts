import type {
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
  UpdateMastersDegreesPayload,
} from '@/lib/api';
import { api } from '@/lib/api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Query Options ────────────────────────────────────────────────────

export const activePeriodQueryOptions = queryOptions({
  queryKey: ['enrollment-periods', 'active'],
  queryFn: api.enrollmentPeriods.findActive,
  staleTime: 5 * 60 * 1000,
});

export const myEnrollmentsQueryOptions = queryOptions({
  queryKey: ['enrollments', 'me'],
  queryFn: api.enrollments.findMine,
  staleTime: 2 * 60 * 1000,
});

export function enrollmentByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['enrollments', id],
    queryFn: () => api.enrollments.findById(id),
    enabled: !!id,
  });
}

// ── Hooks ────────────────────────────────────────────────────────────

export function useActivePeriod() {
  return useQuery(activePeriodQueryOptions);
}

export function useMyEnrollments() {
  return useQuery(myEnrollmentsQueryOptions);
}

export function useEnrollment(id: string) {
  return useQuery(enrollmentByIdQueryOptions(id));
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEnrollmentPayload) => api.enrollments.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEnrollmentPayload }) =>
      api.enrollments.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
    },
  });
}

export function useSubmitEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.enrollments.submit(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
    },
  });
}

export function useUpdateMastersDegrees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMastersDegreesPayload }) =>
      api.enrollments.updateMastersDegrees(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.id] });
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.enrollments.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
    },
  });
}
