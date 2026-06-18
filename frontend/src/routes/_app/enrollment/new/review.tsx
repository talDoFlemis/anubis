import { StepReview } from '@/features/enrollment/components/steps/step-review';
import { createFileRoute } from '@tanstack/react-router';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/review')({
  component: StepReviewPage,
});

function StepReviewPage() {
  const { enrollment, period, handleNext, handleBack } = useEnrollmentWizard();
  return (
    <StepReview enrollment={enrollment} period={period} onNext={handleNext} onBack={handleBack} />
  );
}
