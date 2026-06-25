import { createFileRoute } from '@tanstack/react-router';

import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { CandidateEnrollmentReview } from '@/features/enrollment/components/candidate-enrollment-review';

export const Route = createFileRoute('/_app/manage/enrollments/$id')({
  component: EnrollmentReviewPage,
});

function EnrollmentReviewPage() {
  const { id } = Route.useParams();

  return (
    <ManagementPageLayout>
      <CandidateEnrollmentReview id={id} />
    </ManagementPageLayout>
  );
}
