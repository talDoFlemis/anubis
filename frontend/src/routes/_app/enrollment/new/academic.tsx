import { StepAcademicInfo } from '@/features/enrollment/components/steps/step-academic-info';
import { createFileRoute } from '@tanstack/react-router';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/academic')({
  component: StepAcademicPage,
});

function StepAcademicPage() {
  const { enrollment, period, handleNext, handleBack } = useEnrollmentWizard();
  return (
    <StepAcademicInfo
      enrollment={enrollment}
      period={period}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
