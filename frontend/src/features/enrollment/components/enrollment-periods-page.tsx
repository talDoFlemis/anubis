import { useCallback, useRef, useState, type ReactElement } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronUp, Copy, Eye, HelpCircle, Loader2, Plus, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import type { EnrollmentPeriod } from '@/lib/api';
import type { CreateScoringCategoryPayload, ScoringCategory } from '@/lib/api/cv-scoring';
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

// ── Scoring category form ────────────────────────────────────────────

interface CategoryFormState {
  name: string;
  description: string;
  pointsPerItem: string;
  maxPoints: string;
  sortOrder: string;
}

const DEFAULT_SORT_ORDER = '0';

const EMPTY_FORM: CategoryFormState = {
  name: '',
  description: '',
  pointsPerItem: '',
  maxPoints: '',
  sortOrder: DEFAULT_SORT_ORDER,
};

// ── Local category (for creation flow) ───────────────────────────────

interface LocalCategory {
  id: string; // temp client-side id
  name: string;
  description?: string;
  pointsPerItem: number;
  maxPoints: number;
  level: 'masters' | 'doctoral';
  sortOrder: number;
}

let localIdCounter = 0;
function nextLocalId() {
  return `local-${++localIdCounter}`;
}

function validateCategoryForm(form: CategoryFormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.name.trim()) e.name = 'Nome obrigatório';
  const pts = Number(form.pointsPerItem);
  if (!form.pointsPerItem || isNaN(pts) || pts < 0) e.pointsPerItem = 'Valor inválido';
  const max = Number(form.maxPoints);
  if (!form.maxPoints || isNaN(max) || max < 0) e.maxPoints = 'Valor inválido';
  return e;
}

/**
 * Shared form fields for scoring category creation.
 * Used by both LocalCategoryForm (create period flow) and CategoryForm (edit period flow).
 */
function CategoryFormFields({
  form,
  errors,
  level,
  setForm,
}: {
  form: CategoryFormState;
  errors: Record<string, string>;
  level: 'masters' | 'doctoral';
  setForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Nova Categoria — {LEVEL_LABELS[level]}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field data-invalid={!!errors.name} className="space-y-1">
          <FieldLabel className="text-xs">Nome</FieldLabel>
          <FieldContent>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Artigos publicados"
              className="h-8 text-sm"
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </FieldContent>
        </Field>
        <Field className="space-y-1">
          <FieldLabel className="text-xs">Descrição (opcional)</FieldLabel>
          <FieldContent>
            <Input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição"
              className="h-8 text-sm"
            />
          </FieldContent>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field data-invalid={!!errors.pointsPerItem} className="space-y-1">
          <FieldLabel className="text-xs">Pts/item</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.pointsPerItem}
              onChange={e => setForm(f => ({ ...f, pointsPerItem: e.target.value }))}
              placeholder="1.0"
              className="h-8 text-sm"
            />
            {errors.pointsPerItem && <FieldError>{errors.pointsPerItem}</FieldError>}
          </FieldContent>
        </Field>
        <Field data-invalid={!!errors.maxPoints} className="space-y-1">
          <FieldLabel className="text-xs">Máx. pts</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.maxPoints}
              onChange={e => setForm(f => ({ ...f, maxPoints: e.target.value }))}
              placeholder="3.0"
              className="h-8 text-sm"
            />
            {errors.maxPoints && <FieldError>{errors.maxPoints}</FieldError>}
          </FieldContent>
        </Field>
        <Field className="space-y-1">
          <FieldLabel className="flex items-center gap-1 text-xs">
            Ordem
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="text-muted-foreground h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-52 border-0 bg-blue-50 text-[0.65rem] text-slate-400 shadow-none">
                  Define a ordem de exibição das categorias para o candidato. Menor número aparece primeiro.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FieldLabel>
          <FieldContent>
            <Input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              className="h-8 text-sm"
            />
          </FieldContent>
        </Field>
      </div>
    </>
  );
}

/**
 * Inline form that adds categories to local state (used during period creation).
 */
function LocalCategoryForm({
  level,
  onAdd,
}: {
  level: 'masters' | 'doctoral';
  onAdd: (cat: LocalCategory) => void;
}) {
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleAdd() {
    const e = validateCategoryForm(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onAdd({
      id: nextLocalId(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      pointsPerItem: Number(form.pointsPerItem),
      maxPoints: Number(form.maxPoints),
      level,
      sortOrder: Number(form.sortOrder) || 0,
    });
    setForm(EMPTY_FORM);
    setErrors({});
  }

  return (
    <div className="space-y-3 rounded-xl bg-slate-50/60 p-4">
      <CategoryFormFields form={form} errors={errors} level={level} setForm={setForm} />
      <div className="flex justify-end">
        <Button type="button" size="sm" className="gap-1.5" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

/**
 * Read-only list of locally-added categories with remove button.
 */
function LocalCategoryList({
  level,
  categories,
  onRemove,
}: {
  level: 'masters' | 'doctoral';
  categories: LocalCategory[];
  onRemove: (id: string) => void;
}) {
  const filtered = categories.filter(c => c.level === level);
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700">{LEVEL_LABELS[level]}</h4>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-lg bg-slate-50 py-4 text-center text-xs">
          Nenhuma categoria adicionada.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {filtered.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-400">
                  {cat.pointsPerItem.toFixed(2)} pts/item · máx {cat.maxPoints.toFixed(2)} pts
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-7 w-7"
                onClick={() => onRemove(cat.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  periodId,
  level,
  onSuccess,
}: {
  periodId: string;
  level: 'masters' | 'doctoral';
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (payload: CreateScoringCategoryPayload) =>
      api.cvScoring.createCategory(periodId, payload),
    onSuccess: () => {
      toast.success('Categoria adicionada.');
      setForm(EMPTY_FORM);
      setErrors({});
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao criar categoria.'),
  });

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validateCategoryForm(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      pointsPerItem: Number(form.pointsPerItem),
      maxPoints: Number(form.maxPoints),
      level,
      sortOrder: Number(form.sortOrder) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-slate-50/60 p-4">
      <CategoryFormFields form={form} errors={errors} level={level} setForm={setForm} />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={createMutation.isPending}
          className="gap-1.5"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Adicionar
        </Button>
      </div>
    </form>
  );
}

// ── Category list for a level ────────────────────────────────────────

function CategoryList({
  periodId,
  level,
  readOnly = false,
}: {
  periodId: string;
  readOnly?: boolean;
  level: 'masters' | 'doctoral';
}) {
  const queryClient = useQueryClient();
  const queryKey = ['scoring-categories', periodId, level];

  const { data: categories = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.cvScoring.findCategories(periodId, level),
  });

  const removeMutation = useMutation({
    mutationFn: api.cvScoring.removeCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-categories', periodId] });
      toast.success('Categoria removida.');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao remover.'),
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['scoring-categories', periodId] }),
    [queryClient, periodId],
  );

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
            <div key={cat.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-400">
                  {parseFloat(cat.pointsPerItem).toFixed(2)} pts/item · máx{' '}
                  {parseFloat(cat.maxPoints).toFixed(2)} pts
                </p>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-7 w-7"
                  onClick={() => removeMutation.mutate(cat.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && <CategoryForm periodId={periodId} level={level} onSuccess={invalidate} />}
    </div>
  );
}

// ── Scoring categories panel for a period ────────────────────────────

function ScoringCategoriesPanel({ periodId, readOnly = false }: { periodId: string; readOnly?: boolean }) {
  return (
    <div className="space-y-6">
      <CategoryList periodId={periodId} level="masters" readOnly={readOnly} />
      <CategoryList periodId={periodId} level="doctoral" readOnly={readOnly} />
    </div>
  );
}

// ── Period card ──────────────────────────────────────────────────────

function PeriodCard({
  period,
  allPeriods,
  defaultExpanded = false,
}: {
  period: EnrollmentPeriod;
  allPeriods: EnrollmentPeriod[];
  defaultExpanded?: boolean;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState('');

  const style = STATUS_STYLES[period.status] ?? STATUS_STYLES.scheduled;
  const canClose = period.status === 'open' || period.status === 'scheduled';
  const isClosed = period.status === 'closed';

  const closeMutation = useMutation({
    mutationFn: api.enrollmentPeriods.close,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-periods'] });
      toast.success('Período encerrado com sucesso.');
    },
    onError: () => toast.error('Erro ao encerrar período.'),
  });

  const copyMutation = useMutation({
    mutationFn: ({ targetId, sourceId }: { targetId: string; sourceId: string }) =>
      api.cvScoring.copyFromPeriod(targetId, sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-categories', period.id] });
      toast.success('Categorias copiadas com sucesso!');
      setShowCopyDialog(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao copiar categorias.'),
  });

  const otherPeriods = allPeriods.filter(p => p.id !== period.id);

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
            title={isClosed ? 'Ver categorias de pontuação' : 'Gerenciar categorias de pontuação'}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : isClosed ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <CardContent className="border-t border-slate-100 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Categorias de Pontuação do CV</h3>
            {!isClosed && otherPeriods.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowCopyDialog(true)}
              >
                Copiar de outro período
              </Button>
            )}
          </div>

          <ScoringCategoriesPanel periodId={period.id} readOnly={isClosed} />

          {/* Copy dialog */}
          <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copiar categorias</DialogTitle>
                <DialogDescription>
                  Selecione um período para copiar todas as categorias de pontuação.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                {otherPeriods.map(p => (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                      selectedSourceId === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="source-period"
                      value={p.id}
                      checked={selectedSourceId === p.id}
                      onChange={() => setSelectedSourceId(p.id)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.semester}</p>
                    </div>
                  </label>
                ))}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  disabled={!selectedSourceId || copyMutation.isPending}
                  onClick={() =>
                    copyMutation.mutate({
                      targetId: period.id,
                      sourceId: selectedSourceId,
                    })
                  }
                >
                  {copyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Copiando...
                    </>
                  ) : (
                    'Copiar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedCopySourceId, setSelectedCopySourceId] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const newlyCreatedIdRef = useRef<string | null>(null);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['enrollment-periods'],
    queryFn: api.enrollmentPeriods.findAll,
  });

  function addLocalCategory(cat: LocalCategory) {
    setLocalCategories(prev => [...prev, cat]);
    // Clear the categories error when one is added
    setErrors(prev => {
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  }

  function removeLocalCategory(id: string) {
    setLocalCategories(prev => prev.filter(c => c.id !== id));
  }

  async function handleCopyFromPeriod() {
    if (!selectedCopySourceId) return;
    setIsCopying(true);
    try {
      const categories = await api.cvScoring.findCategories(selectedCopySourceId);
      const imported: LocalCategory[] = categories.map(cat => ({
        id: nextLocalId(),
        name: cat.name,
        description: cat.description ?? undefined,
        pointsPerItem: parseFloat(cat.pointsPerItem),
        maxPoints: parseFloat(cat.maxPoints),
        level: cat.level as 'masters' | 'doctoral',
        sortOrder: cat.sortOrder,
      }));
      setLocalCategories(prev => [...prev, ...imported]);
      setErrors(prev => {
        const next = { ...prev };
        delete next.categories;
        return next;
      });
      toast.success(`${imported.length} categoria(s) importada(s).`);
      setShowCopyDialog(false);
      setSelectedCopySourceId('');
    } catch {
      toast.error('Erro ao copiar categorias.');
    } finally {
      setIsCopying(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!semester.trim()) newErrors.semester = 'Semestre é obrigatório';
    if (!startDate) newErrors.startDate = 'Data de início é obrigatória';
    if (!endDate) newErrors.endDate = 'Data de término é obrigatória';
    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = 'Data de término deve ser posterior à data de início';
    }
    if (localCategories.length === 0) {
      newErrors.categories = 'Adicione pelo menos uma categoria de pontuação';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // 1. Create the period
      const created = await api.enrollmentPeriods.create({
        name,
        semester,
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
      });

      // 2. Batch-create all categories
      await Promise.all(
        localCategories.map(cat =>
          api.cvScoring.createCategory(created.id, {
            name: cat.name,
            description: cat.description,
            pointsPerItem: cat.pointsPerItem,
            maxPoints: cat.maxPoints,
            level: cat.level,
            sortOrder: cat.sortOrder,
          }),
        ),
      );

      newlyCreatedIdRef.current = created.id;
      queryClient.invalidateQueries({ queryKey: ['enrollment-periods'] });
      toast.success('Período de inscrição criado com sucesso!');
      setName('');
      setSemester('');
      setStartDate(undefined);
      setEndDate(undefined);
      setLocalCategories([]);
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
          Crie e gerencie períodos de inscrição e suas categorias de pontuação.
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

            {/* Scoring categories */}
            <div className="space-y-4 rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Categorias de Pontuação do CV
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Adicione as categorias de pontuação para mestrado e doutorado.
                  </p>
                </div>
                {periods.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setShowCopyDialog(true)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar de outro período
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Masters */}
                <div className="space-y-3">
                  <LocalCategoryList
                    level="masters"
                    categories={localCategories}
                    onRemove={removeLocalCategory}
                  />
                  <LocalCategoryForm level="masters" onAdd={addLocalCategory} />
                </div>

                {/* Doctoral */}
                <div className="space-y-3">
                  <LocalCategoryList
                    level="doctoral"
                    categories={localCategories}
                    onRemove={removeLocalCategory}
                  />
                  <LocalCategoryForm level="doctoral" onAdd={addLocalCategory} />
                </div>
              </div>

              {errors.categories && (
                <p className="text-destructive text-sm">{errors.categories}</p>
              )}
            </div>

            {/* Copy from period dialog */}
            <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copiar categorias de outro período</DialogTitle>
                  <DialogDescription>
                    Selecione um período para importar suas categorias de pontuação.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-60 space-y-2 overflow-y-auto py-2">
                  {periods.map(p => (
                    <label
                      key={p.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                        selectedCopySourceId === p.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <input
                        type="radio"
                        name="copy-source-period"
                        value={p.id}
                        checked={selectedCopySourceId === p.id}
                        onChange={() => setSelectedCopySourceId(p.id)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.semester}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    type="button"
                    disabled={!selectedCopySourceId || isCopying}
                    onClick={handleCopyFromPeriod}
                  >
                    {isCopying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      'Importar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            {periods.map((period: EnrollmentPeriod) => {
              const isNewlyCreated = newlyCreatedIdRef.current === period.id;
              if (isNewlyCreated) newlyCreatedIdRef.current = null;
              return (
                <PeriodCard
                  key={period.id}
                  period={period}
                  allPeriods={periods}
                  defaultExpanded={isNewlyCreated}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
