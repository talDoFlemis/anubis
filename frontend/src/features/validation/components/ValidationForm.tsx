import { useCallback, useMemo, useState } from 'react';

import { AlertCircle, Check, CheckCheck, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useCvItems, useScoringCategories } from '@/features/enrollment/hooks/use-cv-scoring';
import { useEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import { useUpdateValidationScore } from '@/features/validation/hooks/use-validation';
import { api, type CvItem, type ScoringCategory } from '@/lib/api';

interface ValidationFormProps {
  enrollmentId: string;
  onSelectPdf: (url: string) => void;
}

function computeItemScores(item: CvItem, category: ScoringCategory) {
  const declared = item.score !== null ? parseFloat(item.score) : item.quantity * parseFloat(category.pointsPerItem);
  const validated = item.adjustedScore !== null ? parseFloat(item.adjustedScore) : null;
  return { declared, validated };
}

export function ValidationForm({ enrollmentId, onSelectPdf }: ValidationFormProps) {
  const { data: enrollment, isLoading: loadingEnrollment } = useEnrollment(enrollmentId);
  const periodId = enrollment?.enrollmentPeriodId ?? '';

  const level = enrollment?.level ?? '';
  const { data: categories, isLoading: loadingCats } = useScoringCategories(periodId ?? '', level);
  const { data: cvItems, isLoading: loadingItems } = useCvItems(enrollmentId);

  const updateScoreMutation = useUpdateValidationScore();

  const [draftStatuses, setDraftStatuses] = useState<Record<string, 'accepted' | 'partial' | 'rejected' | ''>>({});
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [draftJustifications, setDraftJustifications] = useState<Record<string, string>>({});
  const [savingItems, setSavingItems] = useState<Record<string, boolean>>({});

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, CvItem[]>();
    for (const item of cvItems ?? []) {
      const list = map.get(item.scoringCategoryId) ?? [];
      list.push(item);
      map.set(item.scoringCategoryId, list);
    }
    return map;
  }, [cvItems]);

  const sortedCategories = useMemo(
    () => [...(categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const handleViewPdf = useCallback(
    async (itemId: string) => {
      try {
        const url = await api.cvItems.getFileUrl(enrollmentId, itemId);
        onSelectPdf(url);
      } catch {
        toast.error('Erro ao carregar o comprovante deste item.');
      }
    },
    [enrollmentId, onSelectPdf],
  );

  const handleSaveScore = useCallback(
    (
      itemId: string,
      status: 'accepted' | 'partial' | 'rejected',
      adjustedScore?: number,
      justification?: string,
    ) => {
      setSavingItems(prev => ({ ...prev, [itemId]: true }));
      updateScoreMutation.mutate(
        { enrollmentId, itemId, status, adjustedScore, justification },
        {
          onSuccess: () => {
            toast.success('Avaliação salva com sucesso.');
            setSavingItems(prev => ({ ...prev, [itemId]: false }));
            // Clear draft state for this item since it's saved
            setDraftStatuses(prev => {
              const copy = { ...prev };
              delete copy[itemId];
              return copy;
            });
            setDraftScores(prev => {
              const copy = { ...prev };
              delete copy[itemId];
              return copy;
            });
            setDraftJustifications(prev => {
              const copy = { ...prev };
              delete copy[itemId];
              return copy;
            });
          },
          onError: () => {
            toast.error('Erro ao salvar a avaliação.');
            setSavingItems(prev => ({ ...prev, [itemId]: false }));
          },
        },
      );
    },
    [enrollmentId, updateScoreMutation],
  );

  const handleBulkAccept = useCallback(
    (category: ScoringCategory, items: CvItem[]) => {
      items.forEach(item => {
        if (item.verificationStatus !== 'accepted') {
          handleSaveScore(item.id, 'accepted');
        }
      });
      toast.success(`Todos os itens de "${category.name}" foram aceitos.`);
    },
    [handleSaveScore],
  );

  if (loadingEnrollment || loadingCats || loadingItems) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-50 w-full rounded-2xl" />
        <Skeleton className="h-50 w-full rounded-2xl" />
      </div>
    );
  }

  if (!sortedCategories.length) {
    return <p className="text-muted-foreground">Nenhuma categoria encontrada para este edital.</p>;
  }

  return (
    <div className="space-y-6 pb-20">
      {sortedCategories.map(category => {
        const items = itemsByCategory.get(category.id) ?? [];
        if (items.length === 0) return null;

        return (
          <Card key={category.id} className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg text-slate-800">{category.name}</CardTitle>
                <p className="text-muted-foreground text-xs mt-1">
                  Máximo: {category.maxPoints} pts | {category.pointsPerItem} pts por item
                </p>
              </div>

              {/* Opção Bulk Accept */}
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 gap-2"
                onClick={() => handleBulkAccept(category, items)}
                title="Aprovar a nota declarada de todos os itens desta categoria"
              >
                <CheckCheck className="h-4 w-4" />
                Aprovar Todos
              </Button>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-100">
              {items.map(item => {
                const { declared, validated } = computeItemScores(item, category);
                const isSaving = savingItems[item.id];

                // Local states for this item if modified
                const currentStatus = draftStatuses[item.id] ?? (item.verificationStatus !== 'pending' ? item.verificationStatus : '');
                const currentScore = draftScores[item.id] ?? (item.adjustedScore !== null ? item.adjustedScore : declared.toString());
                const currentJustification = draftJustifications[item.id] ?? (item.verificationJustification ?? '');

                const isPending = item.verificationStatus === 'pending';
                const hasLocalChanges =
                  currentStatus !== (item.verificationStatus !== 'pending' ? item.verificationStatus : '') ||
                  (currentStatus === 'partial' && currentScore !== (item.adjustedScore ?? '')) ||
                  currentJustification !== (item.verificationJustification ?? '');

                // Validation
                const isScoreValid = currentStatus === 'partial' ? !isNaN(parseFloat(currentScore)) && parseFloat(currentScore) >= 0 : true;
                const isJustificationRequired = (currentStatus === 'partial' || currentStatus === 'rejected') && parseFloat(currentScore) !== declared;
                const isJustificationValid = isJustificationRequired ? currentJustification.trim().length > 0 : true;
                const isValid = currentStatus !== '' && isScoreValid && isJustificationValid;

                return (
                  <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                      {/* Lado Esquerdo do Item: Descrição e Status */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-700 leading-snug">
                            {item.description}
                          </p>
                          <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                            Qtd: {item.quantity}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                            onClick={() => handleViewPdf(item.id)}
                            disabled={!item.proofFileId}
                          >
                            <Eye className="h-3 w-3 mr-1.5" />
                            {item.proofFileId ? 'Ver Comprovante' : 'Sem Comprovante'}
                          </Button>

                          {/* Badge de status atual */}
                          {item.verificationStatus !== 'pending' && (
                            <div className="flex items-center gap-1 text-xs font-medium">
                              {item.verificationStatus === 'accepted' && (
                                <span className="text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                                  <Check className="h-3 w-3 mr-1" />
                                  Aceito ({declared.toFixed(1)} pts)
                                </span>
                              )}
                              {item.verificationStatus === 'partial' && (
                                <span className="text-amber-600 flex items-center bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Ajustado ({parseFloat(item.adjustedScore || '0').toFixed(1)} / {declared.toFixed(1)} pts)
                                </span>
                              )}
                              {item.verificationStatus === 'rejected' && (
                                <span className="text-rose-600 flex items-center bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Rejeitado (0.0 pts)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito: Nota Declarada */}
                      <div className="shrink-0 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Declarado
                        </p>
                        <p className="text-base font-bold text-slate-700 font-mono">
                          {declared.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Formulário de Verificação Granular */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 mr-2">Avaliação:</span>
                        <Button
                          type="button"
                          variant={currentStatus === 'accepted' ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 text-xs ${
                            currentStatus === 'accepted'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setDraftStatuses(prev => ({ ...prev, [item.id]: 'accepted' }));
                            setDraftScores(prev => ({ ...prev, [item.id]: declared.toString() }));
                          }}
                        >
                          Aceitar Nota
                        </Button>
                        <Button
                          type="button"
                          variant={currentStatus === 'partial' ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 text-xs ${
                            currentStatus === 'partial'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setDraftStatuses(prev => ({ ...prev, [item.id]: 'partial' }));
                          }}
                        >
                          Ajustar Nota
                        </Button>
                        <Button
                          type="button"
                          variant={currentStatus === 'rejected' ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 text-xs ${
                            currentStatus === 'rejected'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setDraftStatuses(prev => ({ ...prev, [item.id]: 'rejected' }));
                            setDraftScores(prev => ({ ...prev, [item.id]: '0' }));
                          }}
                        >
                          Rejeitar Item
                        </Button>
                      </div>

                      {/* Campo de Nota Ajustada (se status for partial) */}
                      {currentStatus === 'partial' && (
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          <label className="text-xs font-semibold text-slate-600">Nota Validada:</label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max={declared}
                            className="h-9 font-mono text-sm border-slate-200"
                            value={currentScore}
                            onChange={e => setDraftScores(prev => ({ ...prev, [item.id]: e.target.value }))}
                          />
                        </div>
                      )}

                      {/* Justificativa Obrigatória (se status for partial ou rejected) */}
                      {(currentStatus === 'partial' || currentStatus === 'rejected') && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                            <span>Justificativa da Alteração:</span>
                            <span className="text-[10px] text-rose-500 font-normal">* Obrigatória</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Descreva o motivo do ajuste ou rejeição da nota..."
                            className={`flex min-h-16 w-full rounded-md border bg-white px-3 py-2 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary ${
                              isJustificationRequired && !currentJustification.trim()
                                ? 'border-rose-300 focus-visible:ring-rose-500'
                                : 'border-slate-200'
                            }`}
                            value={currentJustification}
                            onChange={e => setDraftJustifications(prev => ({ ...prev, [item.id]: e.target.value }))}
                          />
                        </div>
                      )}

                      {/* Botão de Salvar Alterações para este item */}
                      {hasLocalChanges && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <Button
                            size="sm"
                            className="bg-primary text-white text-xs gap-1.5 h-8"
                            disabled={isSaving || !isValid}
                            onClick={() => {
                              const scoreVal = currentStatus === 'partial' ? parseFloat(currentScore) : currentStatus === 'rejected' ? 0 : declared;
                              handleSaveScore(
                                item.id,
                                currentStatus as 'accepted' | 'partial' | 'rejected',
                                scoreVal,
                                currentJustification
                              );
                            }}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Salvar Avaliação
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-slate-500"
                            disabled={isSaving}
                            onClick={() => {
                              // Reset local state to item values
                              setDraftStatuses(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                              setDraftScores(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                              setDraftJustifications(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
