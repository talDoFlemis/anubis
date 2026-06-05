import { StepSigaa } from '@/features/enrollment/components/steps/step-sigaa';
import { createFileRoute } from '@tanstack/react-router';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/sigaa')({
  component: StepSigaaPage,
});

function StepSigaaPage() {
  const { enrollment, period, handleNext, handleBack } = useEnrollmentWizard();
  return (
    <StepSigaa enrollment={enrollment} period={period} onNext={handleNext} onBack={handleBack} />
  );
}
