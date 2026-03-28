import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authQueryOptions } from '@/hooks/use-auth';
import {
  getRestrictedSessionPath,
  isLifecycleAuthPath,
  isRedirectLikeError,
} from '@/lib/auth-flow';

const PUBLIC_HASH_AUTH_PATHS = new Set([
  '/auth/confirm-email',
  '/auth/confirm-new-email',
  '/auth/reset-password',
]);

export const Route = createFileRoute('/auth')({
  beforeLoad: async ({ context, location }) => {
    const isLifecycleRoute = isLifecycleAuthPath(location.pathname);
    const isPublicHashRoute = PUBLIC_HASH_AUTH_PATHS.has(location.pathname);

    if (isPublicHashRoute) {
      return;
    }

    try {
      const user = await context.queryClient.ensureQueryData(authQueryOptions);
      const restrictedPath = getRestrictedSessionPath(user);

      if (restrictedPath) {
        if (location.pathname !== restrictedPath) {
          throw redirect({ to: restrictedPath });
        }

        return;
      }

      throw redirect({ to: '/' });
    } catch (error) {
      if (isRedirectLikeError(error)) {
        throw error;
      }

      if (isLifecycleRoute) {
        throw redirect({ to: '/auth/sign-in' });
      }
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
