import { createFileRoute } from '@tanstack/react-router';
import { StepLevelSelection } from '@/features/enrollment/components/steps/step-level-selection';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/level')({
  component: StepLevelPage,
});

function StepLevelPage() {
  const { enrollment, period, handleNext } = useEnrollmentWizard();
  return <StepLevelSelection enrollment={enrollment} period={period} onNext={handleNext} />;
}
