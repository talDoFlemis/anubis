import { useMemo, useState } from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { StepAcademicInfo } from '@/features/enrollment/components/steps/step-academic-info';
import { StepCvScoring } from '@/features/enrollment/components/steps/step-cv-scoring';
import { StepLevelSelection } from '@/features/enrollment/components/steps/step-level-selection';
import { StepPoscomp } from '@/features/enrollment/components/steps/step-poscomp';
import { WizardStepper } from '@/features/enrollment/components/wizard-stepper';
import { useActivePeriod, useMyEnrollments } from '@/features/enrollment/hooks/use-enrollment';

// ── Search params ────────────────────────────────────────────────────

function validateSearch(search: Record<string, unknown>): { step?: number } {
  const step = Number(search.step);
  return {
    step: Number.isFinite(step) && step >= 0 && step <= 3 ? step : undefined,
  };
}

export const Route = createFileRoute('/_app/enrollment/new')({
  validateSearch,
  component: EnrollmentWizardPage,
});

// ── Page component ───────────────────────────────────────────────────

function EnrollmentWizardPage() {
  const { step: searchStep } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: periods, isLoading: periodsLoading } = useActivePeriod();
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Pick active period
  const activePeriod = useMemo(() => {
    if (!periods?.length) return null;
    return periods.find(p => p.status === 'open') ?? periods[0];
  }, [periods]);

  // Find draft enrollment for this period
  const enrollment = useMemo(() => {
    if (!enrollments?.length || !activePeriod) return null;
    return (
      enrollments.find(e => e.enrollmentPeriodId === activePeriod.id && e.status === 'draft') ??
      null
    );
  }, [enrollments, activePeriod]);

  const currentStep = searchStep ?? 0;

  // ── Step navigation ─────────────────────────────────────────────

  function goToStep(step: number) {
    navigate({ search: { step }, replace: true });
  }

  function handleNext() {
    setCompletedSteps(prev => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  function handleStepClick(step: number) {
    goToStep(step);
  }

  // ── Loading ─────────────────────────────────────────────────────

  if (periodsLoading || enrollmentsLoading) {
    return (
      <div className="mx-auto w-full max-w-300 space-y-8 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!activePeriod) {
    return (
      <div className="mx-auto w-full max-w-300 space-y-8 p-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Inscrição</h1>
        <p className="text-muted-foreground text-sm">
          Nenhum período de inscrição aberto no momento.
        </p>
      </div>
    );
  }

  // ── Step rendering ──────────────────────────────────────────────

  function renderStep() {
    if (!activePeriod) return null;

    const props = {
      enrollment,
      period: activePeriod,
      onNext: handleNext,
      onBack: currentStep > 0 ? handleBack : undefined,
    };

    switch (currentStep) {
      case 0:
        return <StepLevelSelection {...props} />;
      case 1:
        return <StepAcademicInfo {...props} />;
      case 2:
        return <StepPoscomp {...props} />;
      case 3:
        return <StepCvScoring {...props} />;
      default:
        return <StepLevelSelection {...props} />;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/enrollment">Inscrições</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Nova Inscrição</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page title */}
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Inscrição</h1>

      {/* Wizard stepper */}
      <WizardStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Step content */}
      <div className="pb-8">{renderStep()}</div>
    </div>
  );
}
