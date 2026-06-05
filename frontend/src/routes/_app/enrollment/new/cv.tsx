import { StepCvScoring } from '@/features/enrollment/components/steps/step-cv-scoring';
import { createFileRoute } from '@tanstack/react-router';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/cv')({
  component: StepCvScoringPage,
});

function StepCvScoringPage() {
  const { enrollment, period, handleNext, handleBack } = useEnrollmentWizard();
  return (
    <StepCvScoring
      enrollment={enrollment}
      period={period}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
