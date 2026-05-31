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
import { StepSigaa } from '@/features/enrollment/components/steps/step-sigaa';
import { WizardStepper } from '@/features/enrollment/components/wizard-stepper';
import { useActivePeriod, useMyEnrollments } from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment } from '@/lib/api';

// ── Search params ────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

function validateSearch(search: Record<string, unknown>): { step?: number } {
  const step = Number(search.step);
  return {
    step: Number.isFinite(step) && step >= 0 && step < TOTAL_STEPS ? step : undefined,
  };
}

export const Route = createFileRoute('/_app/enrollment/new')({
  validateSearch,
  component: EnrollmentWizardPage,
});

// ── Helpers ──────────────────────────────────────────────────────────

/** Determine which steps are already filled from an existing enrollment. */
function detectCompletedSteps(enrollment: Enrollment | null): number[] {
  if (!enrollment) return [];
  const completed: number[] = [];

  // Step 0 — Level selection (always done if enrollment exists)
  completed.push(0);

  // Step 1 — Academic info (phone + justification)
  if (enrollment.phone && enrollment.justification) {
    completed.push(1);
  }

  // Step 2 — POSCOMP (poscomp data present)
  if (enrollment.poscomp !== null) {
    completed.push(2);
  }

  // Step 3 — CV scoring (checked via score or items — always accessible)
  // We can't determine CV items from the enrollment itself, so mark as accessible but not complete

  // Step 4 — SIGAA
  if (enrollment.sigaaCode) {
    completed.push(4);
  }

  return completed;
}

/** Find the first step not yet completed. */
function findFirstIncompleteStep(completed: number[]): number {
  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (!completed.includes(i)) return i;
  }
  return TOTAL_STEPS - 1;
}

// ── Page component ───────────────────────────────────────────────────

function EnrollmentWizardPage() {
  const { step: searchStep } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: periods, isLoading: periodsLoading } = useActivePeriod();
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();

  // Pick the single active period
  const activePeriod = useMemo(() => {
    if (!periods?.length) return null;
    return periods.find(p => p.status === 'open') ?? null;
  }, [periods]);

  // Find draft enrollment for this period
  const enrollment = useMemo(() => {
    if (!enrollments?.length || !activePeriod) return null;
    return enrollments.find(e => e.enrollmentPeriodId === activePeriod.id && e.status === 'draft') ?? null;
  }, [enrollments, activePeriod]);

  // Auto-detect completed steps from existing enrollment
  const autoCompletedSteps = useMemo(() => detectCompletedSteps(enrollment), [enrollment]);

  const [manualCompletedSteps, setManualCompletedSteps] = useState<number[]>([]);

  // Merge auto-detected + manually completed steps
  const completedSteps = useMemo(() => {
    const set = new Set([...autoCompletedSteps, ...manualCompletedSteps]);
    return Array.from(set).sort();
  }, [autoCompletedSteps, manualCompletedSteps]);

  // Determine initial step: use URL param, or first incomplete step
  const currentStep = searchStep ?? (enrollment ? findFirstIncompleteStep(autoCompletedSteps) : 0);

  // ── Step navigation ─────────────────────────────────────────────

  function goToStep(step: number) {
    navigate({ search: { step }, replace: true });
  }

  function handleNext() {
    setManualCompletedSteps(prev => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  function handleStepClick(step: number) {
    // Allow clicking on completed steps or the current step
    if (completedSteps.includes(step) || step === currentStep) {
      goToStep(step);
    }
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

  const stepProps = {
    enrollment,
    period: activePeriod,
    onNext: handleNext,
    onBack: currentStep > 0 ? handleBack : undefined,
  };

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <StepLevelSelection {...stepProps} />;
      case 1:
        return <StepAcademicInfo {...stepProps} />;
      case 2:
        return <StepPoscomp {...stepProps} />;
      case 3:
        return <StepCvScoring {...stepProps} />;
      case 4:
        return <StepSigaa {...stepProps} />;
      default:
        return null;
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
