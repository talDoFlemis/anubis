import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authQueryOptions } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/app-sidebar';
import { getRestrictedSessionPath, isRedirectLikeError } from '@/lib/auth-flow';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(authQueryOptions);
      const restrictedPath = getRestrictedSessionPath(user);

      if (restrictedPath) {
        throw redirect({ to: restrictedPath });
      }
    } catch (error) {
      if (isRedirectLikeError(error)) {
        throw error;
      }

      throw redirect({ to: '/auth/sign-in' });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppSidebar>
      <Outlet />
    </AppSidebar>
  );
}
