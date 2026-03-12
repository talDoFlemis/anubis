import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api, type User } from '@/lib/api';

export const authQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: api.auth.me,
  retry: false,
  staleTime: 5 * 60 * 1000,
});

export function useAuth() {
  return useQuery(authQueryOptions);
}

export function useEmailLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.auth.emailLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: data.status,
      } as User);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate({ to: '/' });
    },
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.auth.googleLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: data.status,
      } as User);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate({ to: '/' });
    },
  });
}

export function useEmailRegister() {
  return useMutation({
    mutationFn: api.auth.emailRegister,
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
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate({ to: '/auth/sign-in' });
    },
  });
}
