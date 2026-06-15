import { useState, type ReactElement } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronUp, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { EnrollmentPeriod } from '@/lib/api';
import { api } from '@/lib/api';
import type { ScoringCategory } from '@/lib/api/cv-scoring';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Agendado' },
  open: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Aberto' },
  closed: { bg: 'bg-stone-100', text: 'text-stone-500', label: 'Encerrado' },
};

const LEVEL_LABELS: Record<string, string> = {
  masters: 'Mestrado',
  doctoral: 'Doutorado',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Read-only category list for a level ──────────────────────────────
//
// CV scoring sections are defined statically in the backend config
// (cv-scoring-config.ts) and materialized automatically when a period is
// created. They are not staff-authored, so this list is view-only.

function CategoryList({ periodId, level }: { periodId: string; level: 'masters' | 'doctoral' }) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['scoring-categories', periodId, level],
    queryFn: () => api.cvScoring.findCategories(periodId, level),
  });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700">{LEVEL_LABELS[level]}</h4>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground rounded-lg bg-slate-50 py-4 text-center text-xs">
          Nenhuma categoria cadastrada.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {categories.map((cat: ScoringCategory) => (
            <div key={cat.id} className="px-4 py-2.5">
              <p className="text-sm font-medium text-slate-800">{cat.name}</p>
              {cat.description && <p className="mt-0.5 text-xs text-slate-400">{cat.description}</p>}
              <p className="mt-0.5 text-xs text-slate-400">
                máx {parseFloat(cat.maxPoints).toFixed(2)} pts
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scoring categories panel for a period ────────────────────────────

function ScoringCategoriesPanel({ periodId }: { periodId: string }) {
  return (
    <div className="space-y-6">
      <CategoryList periodId={periodId} level="masters" />
      <CategoryList periodId={periodId} level="doctoral" />
    </div>
  );
}

// ── Period card ──────────────────────────────────────────────────────

function PeriodCard({
  period,
  defaultExpanded = false,
  onExpanded,
}: {
  period: EnrollmentPeriod;
  defaultExpanded?: boolean;
  onExpanded?: () => void;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(() => {
    if (defaultExpanded) onExpanded?.();
    return defaultExpanded;
  });

  const style = STATUS_STYLES[period.status] ?? STATUS_STYLES.scheduled;
  const canClose = period.status === 'open' || period.status === 'scheduled';

  const closeMutation = useMutation({
    mutationFn: api.enrollmentPeriods.close,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-periods'] });
      toast.success('Período encerrado com sucesso.');
    },
    onError: () => toast.error('Erro ao encerrar período.'),
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{period.name}</span>
            <Badge className={cn('pointer-events-none border-0 text-xs', style.bg, style.text)}>
              {style.label}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {period.semester} · {formatDate(period.startDate)} → {formatDate(period.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canClose && (
            <Button
              variant="outline"
              size="sm"
              disabled={closeMutation.isPending}
              onClick={() => closeMutation.mutate(period.id)}
            >
              Encerrar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(e => !e)}
            title="Ver categorias de pontuação"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <CardContent className="border-t border-slate-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Categorias de Pontuação do CV
          </h3>
          <ScoringCategoriesPanel periodId={period.id} />
        </CardContent>
      )}
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export function EnrollmentPeriodsPage(): ReactElement {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [semester, setSemester] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['enrollment-periods'],
    queryFn: api.enrollmentPeriods.findAll,
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!semester.trim()) newErrors.semester = 'Semestre é obrigatório';
    if (!startDate) newErrors.startDate = 'Data de início é obrigatória';
    if (!endDate) newErrors.endDate = 'Data de término é obrigatória';
    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = 'Data de término deve ser posterior à data de início';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Categories are seeded automatically by the backend from the static
      // CV scoring config — no category payload is sent from the client.
      const created = await api.enrollmentPeriods.create({
        name,
        semester,
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
      });

      setNewlyCreatedId(created.id);
      queryClient.invalidateQueries({ queryKey: ['enrollment-periods'] });
      toast.success('Período de inscrição criado com sucesso!');
      setName('');
      setSemester('');
      setStartDate(undefined);
      setEndDate(undefined);
      setErrors({});
    } catch {
      toast.error('Erro ao criar período de inscrição.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
          Períodos de Inscrição
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Crie e gerencie períodos de inscrição. As categorias de pontuação do CV são definidas
          pelo sistema e aplicadas automaticamente a cada período.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Novo Período</CardTitle>
          <CardDescription>Preencha os dados para criar um período de inscrição.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <Field data-invalid={!!errors.name} className="space-y-2">
                <FieldLabel htmlFor="period-name">Nome do período</FieldLabel>
                <FieldContent>
                  <Input
                    id="period-name"
                    placeholder="Ex: Seleção MDCC 2026.1"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-9"
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </FieldContent>
              </Field>

              {/* Semester */}
              <Field data-invalid={!!errors.semester} className="space-y-2">
                <FieldLabel htmlFor="period-semester">Semestre</FieldLabel>
                <FieldContent>
                  <Input
                    id="period-semester"
                    placeholder="Ex: 2026.1"
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="h-9"
                  />
                  {errors.semester && <FieldError>{errors.semester}</FieldError>}
                </FieldContent>
              </Field>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.startDate} className="space-y-2">
                <FieldLabel>Data de início</FieldLabel>
                <FieldContent>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Selecione a data de início"
                  />
                  {errors.startDate && <FieldError>{errors.startDate}</FieldError>}
                </FieldContent>
              </Field>

              <Field data-invalid={!!errors.endDate} className="space-y-2">
                <FieldLabel>Data de término</FieldLabel>
                <FieldContent>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Selecione a data de término"
                  />
                  {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
                </FieldContent>
              </Field>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="anubis-gradient-action w-full text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Período'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing periods */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-slate-900">Períodos Existentes</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : periods.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Nenhum período de inscrição cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {periods.map((period: EnrollmentPeriod) => (
              <PeriodCard
                key={period.id}
                period={period}
                defaultExpanded={newlyCreatedId === period.id}
                onExpanded={newlyCreatedId === period.id ? () => setNewlyCreatedId(null) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
