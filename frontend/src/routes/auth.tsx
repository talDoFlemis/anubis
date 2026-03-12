import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authQueryOptions } from '@/hooks/use-auth';

export const Route = createFileRoute('/auth')({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(authQueryOptions);
      throw redirect({ to: '/' });
    } catch (error) {
      if (error instanceof Error && error.message === 'REDIRECT') {
        throw error;
      }
      // Check if it's a redirect error from TanStack Router
      if (error && typeof error === 'object' && 'to' in error) {
        throw error;
      }
      // User is not authenticated, allow access to auth pages
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
