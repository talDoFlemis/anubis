import { useState } from 'react';

import { GraduationCap, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import { useMyCandidateProfile } from '@/hooks/use-auth';
import type { Enrollment, EnrollmentPeriod } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';

// ── Props ────────────────────────────────────────────────────────────

interface StepLevelSelectionProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Level options ────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
  {
    value: 'mestrado',
    label: 'Mestrado',
    description:
      'Programa de pós-graduação stricto sensu voltado para o aprofundamento em pesquisa na área de Ciência da Computação.',
  },
  {
    value: 'doutorado',
    label: 'Doutorado',
    description:
      'Programa de pós-graduação stricto sensu de nível avançado, com foco em contribuições originais para a ciência.',
  },
] as const;

// ── Component ────────────────────────────────────────────────────────

export function StepLevelSelection({ enrollment, period, onNext }: StepLevelSelectionProps) {
  const { data: profile, isLoading: isProfileLoading } = useMyCandidateProfile();
  const createEnrollment = useCreateEnrollment();

  const isExisting = enrollment !== null;
  const [selectedLevel, setSelectedLevel] = useState<string>(
    enrollment?.level ?? period.level ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  function handleSelectLevel(level: string) {
    if (isExisting) return;
    setSelectedLevel(level);
    setError(null);
  }

  function handleNext() {
    if (!selectedLevel) {
      setError('Selecione o nível desejado para continuar.');
      return;
    }

    // If enrollment already exists, just advance
    if (isExisting) {
      onNext();
      return;
    }

    createEnrollment.mutate(
      {
        level: selectedLevel,
        enrollmentPeriodId: period.id,
      },
      {
        onSuccess: () => {
          toast.success('Inscrição iniciada com sucesso.');
          onNext();
        },
        onError: err => {
          toast.error(err.message || 'Erro ao criar inscrição.');
        },
      },
    );
  }

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-10">
      {/* ── Level selection ─────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Nível do programa</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Selecione o nível de pós-graduação para esta inscrição.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LEVEL_OPTIONS.map(option => {
            const isSelected = selectedLevel === option.value;
            const isDisabled = isExisting;

            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelectLevel(option.value)}
                className={cn(
                  'group relative flex flex-col items-start gap-3 rounded-2xl p-6 text-left transition-all',
                  'bg-surface-dim/50 hover:bg-surface-dim',
                  isSelected && 'bg-primary/5 ring-primary/30 ring-2 ring-inset',
                  isDisabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <span className="font-label text-base font-semibold">{option.label}</span>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </section>

      {/* ── Personal data confirmation ─────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Dados pessoais</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Confirme que seus dados estão corretos antes de prosseguir.
          </p>
        </div>

        <div className="bg-surface-dim/40 rounded-2xl p-6 space-y-4">
          {isProfileLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-56" />
            </div>
          ) : profile ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                  <User className="h-5 w-5" />
                </div>
                <span className="font-label text-sm font-semibold">Perfil do candidato</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Nome completo
                  </span>
                  <p className="text-sm font-medium">{fullName || '—'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    CPF
                  </span>
                  <p className="text-sm font-medium">{profile.cpf || '—'}</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    E-mail
                  </span>
                  <p className="text-sm font-medium">{profile.email || '—'}</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/auth/onboarding"
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                >
                  Atualizar dados pessoais
                </Link>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Não foi possível carregar seus dados. Tente novamente.
            </p>
          )}
        </div>
      </section>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleNext}
          disabled={createEnrollment.isPending}
          className="min-w-32"
        >
          {createEnrollment.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Próximo'
          )}
        </Button>
      </div>
    </div>
  );
}
