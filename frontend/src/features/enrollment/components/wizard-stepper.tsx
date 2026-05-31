import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const STEP_LABELS = ['Dados Pessoais', 'Informações Acadêmicas', 'POSCOMP', 'Currículo'] as const;

interface WizardStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function WizardStepper({ currentStep, completedSteps, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Progresso da inscrição" className="w-full px-2 py-4">
      <ol className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isFuture = !isCompleted && !isCurrent;
          const isClickable = isCompleted;

          return (
            <li key={index} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${label}${isCompleted ? ' (concluído)' : ''}${isCurrent ? ' (atual)' : ''}`}
                  className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    isCompleted &&
                      'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
                    isCurrent && 'bg-primary text-primary-foreground',
                    isFuture && 'bg-surface-high text-muted-foreground cursor-default',
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
                </button>
                <span
                  className={cn(
                    'hidden text-center font-serif text-xs sm:block',
                    isCurrent && 'font-bold text-foreground',
                    isCompleted && 'font-medium text-primary',
                    isFuture && 'font-normal text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < STEP_LABELS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-2 mb-6 h-0.5 flex-1 rounded-full sm:mb-7',
                    isCompleted ? 'bg-primary' : 'bg-surface-high',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
