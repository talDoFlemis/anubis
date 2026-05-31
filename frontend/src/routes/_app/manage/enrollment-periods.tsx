import { createFileRoute } from '@tanstack/react-router';

import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { EnrollmentPeriodsPage } from '@/features/enrollment/components/enrollment-periods-page';

export const Route = createFileRoute('/_app/manage/enrollment-periods')({
  component: ManageEnrollmentPeriods,
});

function ManageEnrollmentPeriods() {
  return (
    <ManagementPageLayout>
      <EnrollmentPeriodsPage />
    </ManagementPageLayout>
  );
}
