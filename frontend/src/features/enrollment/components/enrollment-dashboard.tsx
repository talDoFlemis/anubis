import { useMemo } from 'react';

import { CalendarDays, ChevronRight, ClipboardList, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivePeriod, useMyEnrollments } from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';

// ── Status display helpers ───────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { label: 'Rascunho', className: 'bg-amber-100 text-amber-800' };
    case 'submitted':
      return { label: 'Submetida', className: 'bg-blue-100 text-blue-800' };
    case 'closed':
      return { label: 'Encerrada', className: 'bg-gray-100 text-gray-700' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700' };
  }
}

function getLevelLabel(level: string) {
  switch (level) {
    case 'mestrado':
      return 'Mestrado';
    case 'doutorado':
      return 'Doutorado';
    default:
      return level;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ── Enrollment card ──────────────────────────────────────────────────

function EnrollmentCard({
  enrollment,
  period,
}: {
  enrollment: Enrollment;
  period: EnrollmentPeriod | undefined;
}) {
  const statusBadge = getStatusBadge(enrollment.status);
  const isPeriodOpen = period?.status === 'open';
  const isDraft = enrollment.status === 'draft';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{getLevelLabel(enrollment.level)}</Badge>
          <Badge className={cn('border-0', statusBadge.className)}>{statusBadge.label}</Badge>
        </div>

        {period && (
          <div className="mt-3 space-y-1">
            <CardTitle className="text-xl">{period.name}</CardTitle>
            <p className="text-muted-foreground text-sm">Semestre {period.semester}</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Details grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {enrollment.scoreDraft && (
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Pontuação do Currículo
                </p>
                <p className="text-sm font-semibold">
                  {parseFloat(enrollment.scoreDraft).toFixed(1)} pontos
                </p>
              </div>
            </div>
          )}

          {enrollment.submittedAt && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Data de Submissão
                </p>
                <p className="text-sm font-semibold">{formatDate(enrollment.submittedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isDraft && isPeriodOpen && (
          <div className="pt-2">
            <Button asChild className="anubis-gradient-action gap-2 text-white">
              <Link to="/enrollment/new" search={{ step: 0 }}>
                Continuar Inscrição
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {enrollment.status === 'submitted' && (
          <p className="text-muted-foreground pt-2 text-sm italic">
            Sua inscrição foi submetida e está em análise.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── CTA card for new enrollment ──────────────────────────────────────

function NewEnrollmentCta({ period }: { period: EnrollmentPeriod }) {
  return (
    <Card className="anubis-ghost-border bg-surface-dim/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="anubis-gradient-action flex h-11 w-11 items-center justify-center rounded-xl text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Iniciar Inscrição</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {period.name} — Semestre {period.semester}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
          O período de inscrições está aberto. Inicie sua inscrição para o programa de pós-graduação
          em Ciência da Computação.
        </p>
        <Button asChild className="anubis-gradient-action gap-2 text-white">
          <Link to="/enrollment/new">
            Iniciar Inscrição
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────

export function EnrollmentDashboard() {
  const { data: periods, isLoading: periodsLoading } = useActivePeriod();
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();

  const isLoading = periodsLoading || enrollmentsLoading;

  // Pick the first active period (if any)
  const activePeriod = useMemo(() => {
    if (!periods?.length) return null;
    return periods.find(p => p.status === 'open') ?? periods[0];
  }, [periods]);

  // Match enrollments to the active period
  const activeEnrollment = useMemo(() => {
    if (!enrollments?.length || !activePeriod) return null;
    return enrollments.find(e => e.enrollmentPeriodId === activePeriod.id) ?? null;
  }, [enrollments, activePeriod]);

  // Other enrollments (past / different periods)
  const otherEnrollments = useMemo(() => {
    if (!enrollments?.length) return [];
    return enrollments.filter(e => e.id !== activeEnrollment?.id);
  }, [enrollments, activeEnrollment]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-300 space-y-8 p-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">
      {/* Page heading */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Inscrições</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe o status das suas inscrições no programa de pós-graduação.
        </p>
      </div>

      {/* Active enrollment or CTA */}
      {activeEnrollment && activePeriod ? (
        <EnrollmentCard enrollment={activeEnrollment} period={activePeriod} />
      ) : activePeriod ? (
        <NewEnrollmentCta period={activePeriod} />
      ) : (
        <Card className="bg-surface-dim/20">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-dim">
              <Clock className="text-muted-foreground h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-lg font-semibold">
                Nenhum período de inscrição aberto no momento.
              </p>
              <p className="text-muted-foreground text-sm">
                Fique atento às próximas datas de inscrição.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past / other enrollments */}
      {otherEnrollments.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold tracking-tight">Inscrições anteriores</h2>
          <div className="space-y-4">
            {otherEnrollments.map(enrollment => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} period={undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
