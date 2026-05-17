import { Footer } from '@/components/footer';
import { authQueryOptions } from '@/hooks/use-auth';
import { getRestrictedSessionPath, isRedirectLikeError } from '@/lib/auth-flow';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

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
    <div className="flex min-h-svh flex-col">
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
