import { toast } from 'sonner';
import type { LoginResponse, User } from '@/lib/api';

export const AUTH_SIGN_IN_ROUTE = '/auth/sign-in';
export const AUTH_SIGN_UP_ROUTE = '/auth/sign-up';
export const AUTH_ONBOARDING_ROUTE = '/auth/onboarding';
export const AUTH_CONFIRM_NEW_EMAIL_ROUTE = '/auth/confirm-new-email';
export const AUTH_CONFIRM_EMAIL_ROUTE = '/auth/confirm-email';
export const AUTH_FORGOT_PASSWORD_ROUTE = '/auth/forgot-password';
export const AUTH_CHANGE_PASSWORD_ROUTE = '/auth/change-password';
export const AUTH_RESET_PASSWORD_ROUTE = '/auth/reset-password';
export const AUTH_HOME_ROUTE = '/';

export type AuthLifecycleRoute = typeof AUTH_ONBOARDING_ROUTE | typeof AUTH_CHANGE_PASSWORD_ROUTE;

export type PostAuthRoute = typeof AUTH_HOME_ROUTE | AuthLifecycleRoute;

type AuthLifecycleUser = Pick<User | LoginResponse, 'onboardingCompleted' | 'mustChangePassword'>;

export function getRestrictedSessionPath(
  user: AuthLifecycleUser | null | undefined,
): AuthLifecycleRoute | null {
  if (!user) {
    return null;
  }

  if (user.mustChangePassword) {
    return AUTH_CHANGE_PASSWORD_ROUTE;
  }

  if (!user.onboardingCompleted) {
    return AUTH_ONBOARDING_ROUTE;
  }

  return null;
}

export function getPostAuthPath(user: AuthLifecycleUser | null | undefined): PostAuthRoute {
  return getRestrictedSessionPath(user) ?? AUTH_HOME_ROUTE;
}

export function isLifecycleAuthPath(pathname: string): boolean {
  return pathname === AUTH_ONBOARDING_ROUTE || pathname === AUTH_CHANGE_PASSWORD_ROUTE;
}

export function isRedirectLikeError(error: unknown): boolean {
  if (error instanceof Error && error.message === 'REDIRECT') {
    return true;
  }

  return Boolean(error && typeof error === 'object' && 'to' in error);
}

export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  if (password !== confirmPassword) {
    toast.error('As senhas nao coincidem.');
    return false;
  }

  return true;
}

export function validateHashSearch(search: Record<string, unknown>): {
  hash: string;
} {
  return { hash: (search.hash as string) || '' };
}
