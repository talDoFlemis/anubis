import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useEnrollmentWizard } from '../new';

export const Route = createFileRoute('/_app/enrollment/new/')({
  component: RedirectToCurrentStep,
});

function RedirectToCurrentStep() {
  const { enrollment, completedSteps } = useEnrollmentWizard();
  const navigate = useNavigate();

  useEffect(() => {
    const STEP_ROUTES = [
      '/enrollment/new/level',
      '/enrollment/new/academic',
      '/enrollment/new/poscomp',
      '/enrollment/new/cv',
      '/enrollment/new/themes',
      '/enrollment/new/sigaa',
    ];

    let targetStep = 0;
    if (enrollment) {
      for (let i = 0; i < STEP_ROUTES.length; i++) {
        if (!completedSteps.includes(i)) {
          targetStep = i;
          break;
        }
      }
      if (completedSteps.length === STEP_ROUTES.length) {
        targetStep = STEP_ROUTES.length - 1;
      }
    }

    navigate({ to: STEP_ROUTES[targetStep], replace: true });
  }, [enrollment, completedSteps, navigate]);

  return null;
}
