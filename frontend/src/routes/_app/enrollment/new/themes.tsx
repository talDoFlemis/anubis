import { createFileRoute } from '@tanstack/react-router';
import { StepThemeSelection } from '@/features/enrollment/components/steps/step-theme-selection';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/themes')({
  component: StepThemePage,
});

function StepThemePage() {
  const { enrollment, period, handleNext, handleBack } = useEnrollmentWizard();
  return (
    <StepThemeSelection
      enrollment={enrollment}
      period={period}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
