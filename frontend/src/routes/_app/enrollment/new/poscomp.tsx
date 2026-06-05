import { StepPoscomp } from '@/features/enrollment/components/steps/step-poscomp';
import { createFileRoute } from '@tanstack/react-router';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/poscomp')({
  component: StepPoscompPage,
});

function StepPoscompPage() {
  const { enrollment, period, handleNext, handleBack } = useEnrollmentWizard();
  return (
    <StepPoscomp enrollment={enrollment} period={period} onNext={handleNext} onBack={handleBack} />
  );
}
