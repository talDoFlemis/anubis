import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authQueryOptions } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/app-sidebar';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(authQueryOptions);
    } catch {
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
