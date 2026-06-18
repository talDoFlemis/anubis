import { useCallback, useMemo, useState } from 'react';

import { ArrowLeft, Download, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
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
  BASE_CV_SCORE,
  useCreateCvItem,
  useCvItems,
  useRemoveCvItem,
  useScoringCategories,
  useUpdateCvItem,
} from '@/features/enrollment/hooks/use-cv-scoring';

import type { CvItem, Enrollment, EnrollmentPeriod, ScoringCategory } from '@/lib/api';
import { api } from '@/lib/api';

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
  file: File | null;
  quantity: number;
  classification: string;
  isComplete: boolean;
  isResumo: boolean;
  isPeriodico: boolean;
  isAutorPrincipal: boolean;
  isDissertacao: boolean;
  isEncontroIc: boolean;
  isInArea: boolean;
  docenciaType: string;
  eventoType: string;
}

const INITIAL_FORM_STATE: AddItemFormState = {
  description: '',
  file: null,
  quantity: 1,
  classification: 'none',
  isComplete: false,
  isResumo: false,
  isPeriodico: false,
  isAutorPrincipal: false,
  isDissertacao: false,
  isEncontroIc: false,
  isInArea: false,
  docenciaType: 'monitoria',
  eventoType: 'local',
};

// ── Helpers ──────────────────────────────────────────────────────────

function getCategoryKey(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes('projeto') || normalized.includes('participação de projetos'))
    return 'PROJECTS';
  if (normalized.includes('produção científica') || normalized.includes('producao cientifica'))
    return 'PRODUCTION';
  if (
    normalized.includes('docência') ||
    normalized.includes('docencia') ||
    normalized.includes('docente')
  )
    return 'TEACHING';
  if (normalized.includes('orientação') || normalized.includes('orientacao')) return 'ORIENTATION';
  if (
    normalized.includes('apresentação') ||
    normalized.includes('apresentacao') ||
    normalized.includes('evento')
  )
    return 'EVENTS';
  return 'UNKNOWN';
}

function computeCategoryScore(items: CvItem[], category: ScoringCategory, level: string): number {
  const categoryItems = items.filter(i => i.scoringCategoryId === category.id);
  const key = getCategoryKey(category.name);

  let totalScore = 0;
  for (const item of categoryItems) {
    if (item.score !== null) {
      totalScore += parseFloat(item.score);
      continue;
    }

    if (item.isVerified === 'incorrect' && !item.correctedClassification) {
      continue;
    }

    const activeClassification =
      item.isVerified === 'incorrect' && item.correctedClassification
        ? item.correctedClassification
        : item.classification || 'none';

    switch (key) {
      case 'PROJECTS': {
        const basePoints = level === 'masters' ? 0.3 : 0.2;
        const areaBonus = level === 'masters' ? 0.2 : 0.1;
        totalScore += item.quantity * (basePoints + (item.isInArea ? areaBonus : 0));
        break;
      }
      case 'PRODUCTION': {
        if (level === 'masters' && item.isEncontroIc) {
          totalScore += 0.1;
        } else {
          const classPoints: Record<string, number> = {
            A1: 0.6,
            A2: 0.6,
            A3: 0.6,
            A4: 0.6,
            A5: 0.4,
            A6: 0.4,
            A7: 0.2,
            A8: 0.2,
            none: 0.1,
          };
          let itemScore = classPoints[activeClassification] ?? 0.1;
          if (item.isComplete) itemScore += 0.2;
          else if (item.isResumo) itemScore += 0.1;
          if (item.isPeriodico) itemScore += 0.2;
          if (item.isAutorPrincipal) itemScore += 0.2;
          if (level === 'doctoral' && item.isDissertacao) itemScore += 0.1;
          totalScore += itemScore;
        }
        break;
      }
      case 'TEACHING': {
        const points = level === 'masters' ? (item.docenciaType === 'ies' ? 0.3 : 0.2) : 0.2;
        totalScore += item.quantity * points;
        break;
      }
      case 'ORIENTATION': {
        totalScore += item.quantity * 0.2;
        break;
      }
      case 'EVENTS': {
        const points =
          item.eventoType === 'internacional' ? 0.3 : item.eventoType === 'nacional' ? 0.2 : 0.1;
        totalScore += item.quantity * points;
        break;
      }
      default: {
        totalScore += item.quantity * parseFloat(category.pointsPerItem);
        break;
      }
    }
  }

  return parseFloat(Math.min(totalScore, parseFloat(category.maxPoints)).toFixed(2));
}

// ── Component ────────────────────────────────────────────────────────

export function StepCvScoring({ enrollment, period, onNext, onBack }: StepCvScoringProps) {
  const enrollmentId = enrollment?.id ?? '';
  const level = enrollment?.level ?? '';

  const { data: categories, isLoading: categoriesLoading } = useScoringCategories(period.id, level);
  const { data: cvItems, isLoading: itemsLoading } = useCvItems(enrollmentId);

  const createItem = useCreateCvItem();
  const removeItem = useRemoveCvItem();
  const updateItem = useUpdateCvItem();

  // Which category has the inline form open
  const [openFormCategoryId, setOpenFormCategoryId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AddItemFormState>(INITIAL_FORM_STATE);

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{ itemId: string; description: string } | null>(
    null,
  );

  // File replace state
  const [replaceFileItemId, setReplaceFileItemId] = useState<string | null>(null);

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
    if (!sortedCategories.length) return 0;
    return sortedCategories.reduce(
      (sum, cat) => sum + computeCategoryScore(cvItems ?? [], cat, level),
      BASE_CV_SCORE,
    );
  }, [sortedCategories, cvItems, level]);

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

    const category = categories?.find(c => c.id === openFormCategoryId);
    const key = category ? getCategoryKey(category.name) : 'UNKNOWN';

    // Build payload dynamically based on category key
    const payload: any = {
      scoringCategoryId: openFormCategoryId,
      description: formState.description.trim(),
      quantity: formState.quantity,
    };

    if (key === 'PRODUCTION') {
      payload.classification = formState.classification;
      payload.isComplete = formState.isComplete;
      payload.isResumo = formState.isResumo;
      payload.isPeriodico = formState.isPeriodico;
      payload.isAutorPrincipal = formState.isAutorPrincipal;
      if (level === 'doctoral') {
        payload.isDissertacao = formState.isDissertacao;
      } else {
        payload.isEncontroIc = formState.isEncontroIc;
      }
      payload.quantity = 1; // Always 1 for publications
    } else if (key === 'PROJECTS') {
      payload.isInArea = formState.isInArea;
    } else if (key === 'TEACHING' && level === 'masters') {
      payload.docenciaType = formState.docenciaType;
    } else if (key === 'EVENTS') {
      payload.eventoType = formState.eventoType;
      payload.quantity = 1;
    }

    createItem.mutate(
      {
        enrollmentId,
        payload,
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
  }, [openFormCategoryId, enrollmentId, formState, createItem, handleCloseForm, categories, level]);

  const handleDownloadFile = useCallback(
    async (itemId: string) => {
      if (!enrollmentId) return;
      try {
        const url = await api.cvItems.getFileUrl(enrollmentId, itemId);
        window.open(url, '_blank');
      } catch {
        toast.error('Erro ao obter o arquivo.');
      }
    },
    [enrollmentId],
  );

  const handleReplaceFile = useCallback(
    (itemId: string, file: File) => {
      if (!enrollmentId) return;
      updateItem.mutate(
        { enrollmentId, itemId, payload: {}, file },
        {
          onSuccess: () => {
            toast.success('Arquivo substituído com sucesso.');
            setReplaceFileItemId(null);
          },
          onError: err => {
            toast.error(err.message || 'Erro ao substituir arquivo.');
          },
        },
      );
    },
    [enrollmentId, updateItem],
  );

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
          const categoryScore = computeCategoryScore(cvItems ?? [], category, level);
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
                      Pontuação máxima de {category.maxPoints} ponto(s)
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
                      <div key={item.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {item.description}
                            </p>
                            <div className="text-muted-foreground text-xs flex flex-wrap gap-1.5 mt-1">
                              {(() => {
                                const key = getCategoryKey(category.name);
                                if (key === 'PROJECTS') {
                                  return (
                                    <span>
                                      {item.quantity} semestre(s)
                                      {item.isInArea && ' · Na área de pesquisa'}
                                    </span>
                                  );
                                }
                                if (key === 'PRODUCTION') {
                                  const details = [];
                                  if (item.classification && item.classification !== 'none') {
                                    details.push(`Qualis ${item.classification}`);
                                  } else {
                                    details.push('Sem Qualis');
                                  }
                                  if (item.isComplete) details.push('Artigo completo');
                                  if (item.isResumo) details.push('Resumo/pôster');
                                  if (item.isPeriodico) details.push('Periódico');
                                  if (item.isAutorPrincipal) details.push('Autor principal');
                                  if (item.isDissertacao) details.push('Fruto de dissertação');
                                  if (item.isEncontroIc) details.push('Encontro de IC');
                                  return <span>{details.join(' · ')}</span>;
                                }
                                if (key === 'TEACHING') {
                                  return (
                                    <span>
                                      {item.quantity} semestre(s)
                                      {level === 'masters' &&
                                        ` · ${item.docenciaType === 'ies' ? 'Docente IES' : 'Monitoria'}`}
                                    </span>
                                  );
                                }
                                if (key === 'EVENTS') {
                                  const scope =
                                    item.eventoType === 'internacional'
                                      ? 'Internacional'
                                      : item.eventoType === 'nacional'
                                        ? 'Nacional'
                                        : 'Local';
                                  return <span>Apresentação {scope}</span>;
                                }
                                if (key === 'ORIENTATION') {
                                  return <span>{item.quantity} aluno-semestre(s)</span>;
                                }
                                return <span>Qtd: {item.quantity}</span>;
                              })()}

                              {item.proofFileName ? (
                                <span> · {item.proofFileName}</span>
                              ) : item.proofFileId ? (
                                <span> · Comprovante enviado</span>
                              ) : null}

                              {item.score !== null && (
                                <span className="font-semibold text-primary">
                                  {' '}
                                  · {parseFloat(item.score).toFixed(1)} pts
                                </span>
                              )}

                              {item.isVerified !== 'pending' && (
                                <span
                                  className={
                                    item.isVerified === 'verified'
                                      ? 'text-green-600 font-semibold'
                                      : 'text-red-600 font-semibold'
                                  }
                                >
                                  · {item.isVerified === 'verified' ? 'Validado' : 'Incorreto'}
                                  {item.correctedClassification &&
                                    ` (Corrigido para ${item.correctedClassification})`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {item.proofFileId && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                                  onClick={() => handleDownloadFile(item.id)}
                                  title="Baixar comprovante"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                                  onClick={() => setReplaceFileItemId(item.id)}
                                  title="Substituir comprovante"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-8 w-8"
                              onClick={() =>
                                setDeleteTarget({ itemId: item.id, description: item.description })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {replaceFileItemId === item.id && (
                          <div className="flex items-center gap-2 pl-1">
                            <input
                              type="file"
                              className="text-sm"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleReplaceFile(item.id, file);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplaceFileItemId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline add form */}
                {isFormOpen ? (
                  <div className="space-y-4 rounded-2xl bg-surface-dim/40 p-5">
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${category.id}`}>Descrição / Título do Item</Label>
                      <Input
                        id={`desc-${category.id}`}
                        placeholder="Ex: Artigo publicado no SBBD, Iniciação Científica no MDCC"
                        value={formState.description}
                        onChange={e => setFormState(s => ({ ...s, description: e.target.value }))}
                      />
                    </div>

                    {/* Dynamic Fields */}
                    {(() => {
                      const key = getCategoryKey(category.name);
                      if (key === 'PROJECTS') {
                        return (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`qty-${category.id}`}>Quantidade de Semestres</Label>
                              <Input
                                id={`qty-${category.id}`}
                                type="number"
                                min="1"
                                value={formState.quantity}
                                onChange={e =>
                                  setFormState(s => ({
                                    ...s,
                                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                                  }))
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                              <input
                                id={`area-${category.id}`}
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                checked={formState.isInArea}
                                onChange={e =>
                                  setFormState(s => ({ ...s, isInArea: e.target.checked }))
                                }
                              />
                              <Label htmlFor={`area-${category.id}`} className="cursor-pointer">
                                Na área de pesquisa da candidatura
                              </Label>
                            </div>
                          </div>
                        );
                      }
                      if (key === 'PRODUCTION') {
                        return (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`class-${category.id}`}>
                                Classificação CAPES (A1 a A8)
                              </Label>
                              <select
                                id={`class-${category.id}`}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                value={formState.classification}
                                onChange={e =>
                                  setFormState(s => ({ ...s, classification: e.target.value }))
                                }
                              >
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="A3">A3</option>
                                <option value="A4">A4</option>
                                <option value="A5">A5</option>
                                <option value="A6">A6</option>
                                <option value="A7">A7</option>
                                <option value="A8">A8</option>
                                <option value="none">Não qualificado / Outro</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                              <div className="flex items-center gap-2">
                                <input
                                  id={`comp-${category.id}`}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  checked={formState.isComplete}
                                  onChange={e =>
                                    setFormState(s => ({
                                      ...s,
                                      isComplete: e.target.checked,
                                      isResumo: e.target.checked ? false : s.isResumo,
                                    }))
                                  }
                                />
                                <Label htmlFor={`comp-${category.id}`} className="cursor-pointer">
                                  Artigo completo
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  id={`res-${category.id}`}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  checked={formState.isResumo}
                                  onChange={e =>
                                    setFormState(s => ({
                                      ...s,
                                      isResumo: e.target.checked,
                                      isComplete: e.target.checked ? false : s.isComplete,
                                    }))
                                  }
                                />
                                <Label htmlFor={`res-${category.id}`} className="cursor-pointer">
                                  Resumo/pôster
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  id={`per-${category.id}`}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  checked={formState.isPeriodico}
                                  onChange={e =>
                                    setFormState(s => ({ ...s, isPeriodico: e.target.checked }))
                                  }
                                />
                                <Label htmlFor={`per-${category.id}`} className="cursor-pointer">
                                  Periódico
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  id={`aut-${category.id}`}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  checked={formState.isAutorPrincipal}
                                  onChange={e =>
                                    setFormState(s => ({
                                      ...s,
                                      isAutorPrincipal: e.target.checked,
                                    }))
                                  }
                                />
                                <Label htmlFor={`aut-${category.id}`} className="cursor-pointer">
                                  Autor principal
                                </Label>
                              </div>
                              {level === 'doctoral' ? (
                                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                  <input
                                    id={`diss-${category.id}`}
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={formState.isDissertacao}
                                    onChange={e =>
                                      setFormState(s => ({ ...s, isDissertacao: e.target.checked }))
                                    }
                                  />
                                  <Label htmlFor={`diss-${category.id}`} className="cursor-pointer">
                                    Fruto de dissertação
                                  </Label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                  <input
                                    id={`enc-${category.id}`}
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={formState.isEncontroIc}
                                    onChange={e =>
                                      setFormState(s => ({ ...s, isEncontroIc: e.target.checked }))
                                    }
                                  />
                                  <Label htmlFor={`enc-${category.id}`} className="cursor-pointer">
                                    Encontro de IC
                                  </Label>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      if (key === 'TEACHING') {
                        return (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`qty-${category.id}`}>Quantidade de Semestres</Label>
                              <Input
                                id={`qty-${category.id}`}
                                type="number"
                                min="1"
                                value={formState.quantity}
                                onChange={e =>
                                  setFormState(s => ({
                                    ...s,
                                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                                  }))
                                }
                              />
                            </div>
                            {level === 'masters' && (
                              <div className="space-y-2">
                                <Label htmlFor={`type-${category.id}`}>Tipo de Atividade</Label>
                                <select
                                  id={`type-${category.id}`}
                                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                  value={formState.docenciaType}
                                  onChange={e =>
                                    setFormState(s => ({ ...s, docenciaType: e.target.value }))
                                  }
                                >
                                  <option value="monitoria">
                                    Iniciação à docência (Monitoria)
                                  </option>
                                  <option value="ies">Docência em IES</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      }
                      if (key === 'EVENTS') {
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={`scope-${category.id}`}>
                              Amplitude / Escopo do Evento
                            </Label>
                            <select
                              id={`scope-${category.id}`}
                              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                              value={formState.eventoType}
                              onChange={e =>
                                setFormState(s => ({ ...s, eventoType: e.target.value }))
                              }
                            >
                              <option value="local">Local</option>
                              <option value="nacional">Amplitude Nacional</option>
                              <option value="internacional">Amplitude Internacional</option>
                            </select>
                          </div>
                        );
                      }
                      if (key === 'ORIENTATION') {
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={`qty-${category.id}`}>
                              Quantidade de Aluno-Semestres
                            </Label>
                            <Input
                              id={`qty-${category.id}`}
                              type="number"
                              min="1"
                              value={formState.quantity}
                              onChange={e =>
                                setFormState(s => ({
                                  ...s,
                                  quantity: Math.max(1, parseInt(e.target.value) || 1),
                                }))
                              }
                            />
                            <p className="text-muted-foreground text-xs">
                              Ex: 1 aluno por 2 semestres = 2 aluno-semestres
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <FileUploadField
                      label="Comprovante (PDF ou Imagem)"
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
            <span className="font-serif text-lg font-semibold">Pontuação total do currículo</span>
            <span className="font-label text-primary text-2xl font-bold">
              {totalScore.toFixed(1)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <div />
        )}
        <Button type="button" onClick={onNext} className="min-w-32">
          Próximo
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
    </div>
  );
}
