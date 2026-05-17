import { api, type User } from '@/lib/api';
import { AUTH_SIGN_IN_ROUTE, getPostAuthPath } from '@/lib/auth-flow';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

export const authQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: api.auth.me,
  retry: false,
  staleTime: 5 * 60 * 1000,
});

export function useAuth() {
  return useQuery(authQueryOptions);
}

export const myCandidateProfileQueryOptions = queryOptions({
  queryKey: ['candidates', 'me'],
  queryFn: api.candidates.me,
  retry: false,
  staleTime: 5 * 60 * 1000,
});

export function useMyCandidateProfile(enabled = true) {
  return useQuery({
    ...myCandidateProfileQueryOptions,
    enabled,
  });
}

async function refreshCurrentUser(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  return queryClient.fetchQuery({ ...authQueryOptions, staleTime: 0 });
}

export function useEmailLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.auth.emailLogin,
    onSuccess: async data => {
      await refreshCurrentUser(queryClient);
      queryClient.invalidateQueries({ queryKey: ['candidates', 'me'] });
      navigate({ to: getPostAuthPath(data) });
    },
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.auth.googleLogin,
    onSuccess: async data => {
      await refreshCurrentUser(queryClient);
      queryClient.invalidateQueries({ queryKey: ['candidates', 'me'] });
      navigate({ to: getPostAuthPath(data) });
    },
  });
}

export function useEmailRegister() {
  return useMutation({
    mutationFn: api.auth.emailRegister,
  });
}

export function useCompleteCandidateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.auth.completeCandidateOnboarding,
    onSuccess: async user => {
      queryClient.setQueryData(['auth', 'me'], user);
      await refreshCurrentUser(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['candidates', 'me'] });
    },
  });
}

export function useCompleteProfessorOnboarding() {
  return useMutation({
    mutationFn: api.auth.completeProfessorOnboarding,
  });
}

export function useResendProfessorOnboarding() {
  return useMutation({
    mutationFn: api.auth.resendProfessorOnboarding,
  });
}

export function useVerifyOnboardingToken() {
  return useMutation({
    mutationFn: api.auth.verifyOnboardingToken,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.auth.update,
    onSuccess: async user => {
      queryClient.setQueryData(['auth', 'me'], user as User | null);
      await refreshCurrentUser(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['candidates', 'me'] });
    },
  });
}

export function useConfirmEmail() {
  return useMutation({
    mutationFn: api.auth.confirmEmail,
  });
}

export function useConfirmNewEmail() {
  return useMutation({
    mutationFn: api.auth.confirmNewEmail,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: api.auth.forgotPassword,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: api.auth.resetPassword,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate({ to: AUTH_SIGN_IN_ROUTE });
    },
  });
}
