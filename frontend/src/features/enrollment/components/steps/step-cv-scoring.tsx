import { useCallback, useMemo, useState } from 'react';

import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUploadField } from '@/features/enrollment/components/file-upload-field';
import {
  useCreateCvItem,
  useCvItems,
  useRemoveCvItem,
  useScoringCategories,
} from '@/features/enrollment/hooks/use-cv-scoring';
import { useSubmitEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import type { CvItem, Enrollment, EnrollmentPeriod, ScoringCategory } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Props ────────────────────────────────────────────────────────────

interface StepCvScoringProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Inline add-item form state ───────────────────────────────────────

interface AddItemFormState {
  description: string;
  quantity: number;
  isInArea: boolean;
  file: File | null;
}

const INITIAL_FORM_STATE: AddItemFormState = {
  description: '',
  quantity: 1,
  isInArea: false,
  file: null,
};

// ── Helpers ──────────────────────────────────────────────────────────

function computeCategoryScore(items: CvItem[], category: ScoringCategory): number {
  const categoryItems = items.filter(i => i.scoringCategoryId === category.id);
  const rawScore = categoryItems.reduce((sum, item) => {
    if (item.score !== null) return sum + parseFloat(item.score);
    return sum + item.quantity * parseFloat(category.pointsPerItem);
  }, 0);
  return Math.min(rawScore, parseFloat(category.maxPoints));
}

// ── Component ────────────────────────────────────────────────────────

export function StepCvScoring({ enrollment, period, onNext, onBack }: StepCvScoringProps) {
  const enrollmentId = enrollment?.id ?? '';
  const level = enrollment?.level ?? '';

  const { data: categories, isLoading: categoriesLoading } = useScoringCategories(period.id, level);
  const { data: cvItems, isLoading: itemsLoading } = useCvItems(enrollmentId);

  const createItem = useCreateCvItem();
  const removeItem = useRemoveCvItem();
  const submitEnrollment = useSubmitEnrollment();

  // Which category has the inline form open
  const [openFormCategoryId, setOpenFormCategoryId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AddItemFormState>(INITIAL_FORM_STATE);

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{ itemId: string; description: string } | null>(
    null,
  );

  // Submit confirmation dialog
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // ── Computed values ──────────────────────────────────────────────

  const sortedCategories = useMemo(
    () => [...(categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, CvItem[]>();
    for (const item of cvItems ?? []) {
      const list = map.get(item.scoringCategoryId) ?? [];
      list.push(item);
      map.set(item.scoringCategoryId, list);
    }
    return map;
  }, [cvItems]);

  const totalScore = useMemo(() => {
    if (!sortedCategories.length || !cvItems) return 0;
    return sortedCategories.reduce((sum, cat) => sum + computeCategoryScore(cvItems, cat), 0);
  }, [sortedCategories, cvItems]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleOpenForm = useCallback((categoryId: string) => {
    setOpenFormCategoryId(categoryId);
    setFormState(INITIAL_FORM_STATE);
  }, []);

  const handleCloseForm = useCallback(() => {
    setOpenFormCategoryId(null);
    setFormState(INITIAL_FORM_STATE);
  }, []);

  const handleSaveItem = useCallback(() => {
    if (!openFormCategoryId || !enrollmentId) return;
    if (!formState.description.trim()) {
      toast.error('Informe uma descrição para o item.');
      return;
    }

    createItem.mutate(
      {
        enrollmentId,
        payload: {
          scoringCategoryId: openFormCategoryId,
          description: formState.description.trim(),
          quantity: formState.quantity,
          isInArea: formState.isInArea || undefined,
        },
        file: formState.file ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success('Item adicionado com sucesso.');
          handleCloseForm();
        },
        onError: err => {
          toast.error(err.message || 'Erro ao adicionar item.');
        },
      },
    );
  }, [openFormCategoryId, enrollmentId, formState, createItem, handleCloseForm]);

  const handleDeleteItem = useCallback(() => {
    if (!deleteTarget || !enrollmentId) return;

    removeItem.mutate(
      { enrollmentId, itemId: deleteTarget.itemId },
      {
        onSuccess: () => {
          toast.success('Item removido.');
          setDeleteTarget(null);
        },
        onError: err => {
          toast.error(err.message || 'Erro ao remover item.');
        },
      },
    );
  }, [deleteTarget, enrollmentId, removeItem]);

  const handleSubmit = useCallback(() => {
    if (!enrollmentId) return;

    submitEnrollment.mutate(enrollmentId, {
      onSuccess: () => {
        toast.success('Inscrição submetida com sucesso!');
        setShowSubmitDialog(false);
        onNext();
      },
      onError: err => {
        toast.error(err.message || 'Erro ao submeter inscrição.');
        setShowSubmitDialog(false);
      },
    });
  }, [enrollmentId, submitEnrollment, onNext]);

  // ── Loading state ───────────────────────────────────────────────

  if (!enrollment) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          Nenhuma inscrição encontrada. Volte à etapa anterior.
        </p>
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar
          </Button>
        )}
      </div>
    );
  }

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Pontuação do Currículo</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Adicione os itens do seu currículo em cada categoria. A pontuação é calculada
          automaticamente com base nos critérios definidos.
        </p>
      </section>

      {/* Category cards */}
      <div className="space-y-6">
        {sortedCategories.map(category => {
          const items = itemsByCategory.get(category.id) ?? [];
          const categoryScore = computeCategoryScore(cvItems ?? [], category);
          const maxPoints = parseFloat(category.maxPoints);
          const progressPct = maxPoints > 0 ? Math.min((categoryScore / maxPoints) * 100, 100) : 0;
          const isFormOpen = openFormCategoryId === category.id;

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {category.description}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {category.pointsPerItem} ponto(s) por item • Máximo {category.maxPoints}{' '}
                      ponto(s)
                      {category.requiresAreaVerification && ' • Aceita verificação de área'}
                    </p>
                  </div>
                  <div className="font-label text-right text-sm font-semibold whitespace-nowrap">
                    {categoryScore.toFixed(1)} / {maxPoints.toFixed(1)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-dim">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Existing items */}
                {items.length > 0 && (
                  <div className="divide-y divide-surface-dim">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.description}</p>
                          <p className="text-muted-foreground text-xs">
                            Qtd: {item.quantity}
                            {item.isInArea && ' • Na área'}
                            {item.score !== null && ` • ${parseFloat(item.score).toFixed(1)} pts`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                          onClick={() =>
                            setDeleteTarget({ itemId: item.id, description: item.description })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline add form */}
                {isFormOpen ? (
                  <div className="space-y-4 rounded-2xl bg-surface-dim/40 p-5">
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${category.id}`}>Descrição</Label>
                      <Input
                        id={`desc-${category.id}`}
                        placeholder="Descreva o item do currículo"
                        value={formState.description}
                        onChange={e => setFormState(s => ({ ...s, description: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`qty-${category.id}`}>Quantidade</Label>
                      <Input
                        id={`qty-${category.id}`}
                        type="number"
                        min={1}
                        value={formState.quantity}
                        onChange={e =>
                          setFormState(s => ({
                            ...s,
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          }))
                        }
                        className="max-w-32"
                      />
                    </div>

                    {category.requiresAreaVerification && (
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={formState.isInArea}
                          onChange={e => setFormState(s => ({ ...s, isInArea: e.target.checked }))}
                          className="accent-primary h-4 w-4 rounded"
                        />
                        Item na área de concentração
                      </label>
                    )}

                    <FileUploadField
                      label="Comprovante"
                      value={formState.file}
                      onChange={file => setFormState(s => ({ ...s, file }))}
                    />

                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveItem}
                        disabled={createItem.isPending}
                      >
                        {createItem.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCloseForm}
                        disabled={createItem.isPending}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenForm(category.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar item
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Running total */}
      {sortedCategories.length > 0 && (
        <Card className="bg-surface-dim/30">
          <CardContent className="flex items-center justify-between p-7">
            <span className="font-serif text-lg font-semibold">Pontuação total</span>
            <span className="font-label text-primary text-2xl font-bold">
              {totalScore.toFixed(1)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar
          </Button>
        ) : (
          <div />
        )}
        <Button
          type="button"
          className={cn('min-w-44', 'anubis-gradient-action text-white')}
          onClick={() => setShowSubmitDialog(true)}
        >
          Finalizar e Submeter
        </Button>
      </div>

      {/* ── Delete confirmation dialog ────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover item</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong className="text-foreground">{deleteTarget?.description}</strong>? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={removeItem.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={removeItem.isPending}
            >
              {removeItem.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Submit confirmation dialog ────────────────────────────── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-primary h-5 w-5" />
              Submeter inscrição
            </DialogTitle>
            <DialogDescription>
              Após a submissão, você não poderá mais editar sua inscrição. Certifique-se de que
              todos os dados e documentos estão corretos antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-surface-dim/40 rounded-2xl p-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Pontuação do currículo:</span>{' '}
              <strong>{totalScore.toFixed(1)} pontos</strong>
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitEnrollment.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="anubis-gradient-action text-white"
              onClick={handleSubmit}
              disabled={submitEnrollment.isPending}
            >
              {submitEnrollment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submetendo...
                </>
              ) : (
                'Confirmar Submissão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
