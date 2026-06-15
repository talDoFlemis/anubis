import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { WizardStepper } from '@/features/enrollment/components/wizard-stepper';
import { useActivePeriod, useMyEnrollments } from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod } from '@/lib/api';
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { createContext, useContext, useMemo, useState } from 'react';

// ── Context definition ────────────────────────────────────────────────

interface EnrollmentWizardContextType {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  completedSteps: number[];
  handleNext: () => void;
  handleBack: () => void;
}

const EnrollmentWizardContext = createContext<EnrollmentWizardContextType | null>(null);

export function useEnrollmentWizard() {
  const context = useContext(EnrollmentWizardContext);
  if (!context) {
    throw new Error('useEnrollmentWizard must be used within an EnrollmentWizardProvider');
  }
  return context;
}

export const Route = createFileRoute('/_app/enrollment/new')({
  component: EnrollmentWizardLayout,
});

// ── Helpers ──────────────────────────────────────────────────────────

export const STEP_ROUTES = [
  '/enrollment/new/level',
  '/enrollment/new/themes',
  '/enrollment/new/academic',
  '/enrollment/new/poscomp',
  '/enrollment/new/cv',
  '/enrollment/new/sigaa',
] as const;

function detectCompletedSteps(enrollment: Enrollment | null): number[] {
  if (!enrollment) return [];
  const completed: number[] = [];

  completed.push(0);

  if (enrollment.primaryThemeId && enrollment.secondaryThemeId) {
    completed.push(1);
  }

  if (enrollment.phone && enrollment.justification) {
    completed.push(2);
  }

  if (enrollment.poscomp !== null) {
    completed.push(3);
  }

  if (enrollment.sigaaCode) {
    completed.push(5);
  }

  return completed;
}

// ── Layout component ─────────────────────────────────────────────────

function EnrollmentWizardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: periods, isLoading: periodsLoading } = useActivePeriod();
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();

  const activePeriod = useMemo(() => {
    if (!periods?.length) return null;
    return periods.find(p => p.status === 'open') ?? null;
  }, [periods]);

  const enrollment = useMemo(() => {
    if (!enrollments?.length || !activePeriod) return null;
    return (
      enrollments.find(e => e.enrollmentPeriodId === activePeriod.id && e.status === 'draft') ??
      null
    );
  }, [enrollments, activePeriod]);

  const autoCompletedSteps = useMemo(() => detectCompletedSteps(enrollment), [enrollment]);
  const [manualCompletedSteps, setManualCompletedSteps] = useState<number[]>([]);

  const completedSteps = useMemo(() => {
    const set = new Set([...autoCompletedSteps, ...manualCompletedSteps]);
    return Array.from(set).sort();
  }, [autoCompletedSteps, manualCompletedSteps]);

  const currentStep = useMemo(() => {
    const index = STEP_ROUTES.indexOf(location.pathname as (typeof STEP_ROUTES)[number]);
    return index === -1 ? 0 : index;
  }, [location.pathname]);

  function goToStep(step: number) {
    navigate({ to: STEP_ROUTES[step], replace: true });
  }

  function handleNext() {
    setManualCompletedSteps(prev => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    if (currentStep < STEP_ROUTES.length - 1) {
      goToStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  function handleStepClick(step: number) {
    if (completedSteps.includes(step) || step === currentStep) {
      goToStep(step);
    }
  }

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

  const contextValue = {
    enrollment,
    period: activePeriod,
    completedSteps,
    handleNext,
    handleBack,
  };

  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">
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

      <h1 className="font-serif text-3xl font-semibold tracking-tight">Inscrição</h1>

      <WizardStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="pb-8">
        <EnrollmentWizardContext.Provider value={contextValue}>
          <Outlet />
        </EnrollmentWizardContext.Provider>
      </div>
    </div>
  );
}
