import { createFileRoute } from '@tanstack/react-router';

import { EnrollmentDashboard } from '@/features/enrollment/components/enrollment-dashboard';

export const Route = createFileRoute('/_app/enrollment/')({
  component: EnrollmentDashboard,
});
