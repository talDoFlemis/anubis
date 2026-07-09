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
import { ScoreAdjustmentPanel } from './ScoreAdjustmentPanel';

interface ValidationFormProps {
  enrollmentId: string;
  onSelectPdf: (url: string) => void;
}

function computeItemScores(item: CvItem, category: ScoringCategory) {
  const declared = item.quantity * parseFloat(category.pointsPerItem);
  const validated = item.score !== null ? parseFloat(item.score) : null;
  return { declared, validated };
}

export function ValidationForm({ enrollmentId, onSelectPdf }: ValidationFormProps) {
  const { data: enrollment, isLoading: loadingEnrollment } = useEnrollment(enrollmentId);
  const periodId = enrollment?.enrollmentPeriodId ?? '';

  const level = enrollment?.level ?? '';
  const { data: categories, isLoading: loadingCats } = useScoringCategories(periodId ?? '', level);
  const { data: cvItems, isLoading: loadingItems } = useCvItems(enrollmentId);

  const updateScoreMutation = useUpdateValidationScore();

  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
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
    (itemId: string, scoreValue: number | null) => {
      setSavingItems(prev => ({ ...prev, [itemId]: true }));
      updateScoreMutation.mutate(
        { enrollmentId, itemId, score: scoreValue },
        {
          onSuccess: () => {
            toast.success('Nota salva com sucesso.');
            setSavingItems(prev => ({ ...prev, [itemId]: false }));
          },
          onError: () => {
            toast.error('Erro ao salvar a nota.');
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
        const { declared, validated } = computeItemScores(item, category);
        if (validated !== declared) {
          handleSaveScore(item.id, declared);
          setDraftScores(prev => ({ ...prev, [item.id]: declared.toString() }));
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
                const currentDraft =
                  draftScores[item.id] ?? (validated !== null ? validated.toString() : '');
                const isSaving = savingItems[item.id];
                const isPending = validated === null;
                const isDiff = validated !== null && validated !== declared;

                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
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

                          {/* Visual Diff Badge */}
                          {!isPending && (
                            <div className="flex items-center gap-1 text-xs font-medium">
                              {isDiff ? (
                                <span className="text-rose-600 flex items-center bg-rose-50 px-2 py-0.5 rounded">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Nota Alterada
                                </span>
                              ) : (
                                <span className="text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded">
                                  <Check className="h-3 w-3 mr-1" />
                                  Nota Aceita
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito do Item: Campos de Nota */}
                      <div className="flex items-center gap-4 shrink-0 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-right">
                          <p className="text-[10px] font-label text-slate-400 uppercase">
                            Declarado
                          </p>
                          <p className="text-sm font-semibold text-slate-600">
                            {declared.toFixed(1)}
                          </p>
                        </div>

                        <div className="w-px h-8 bg-slate-200" />

                        <div className="flex flex-col items-end gap-1">
                          <p className="text-[10px] font-label text-primary uppercase">Validado</p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              className={`h-8 w-20 text-right font-mono text-sm ${
                                isDiff ? 'border-rose-300 focus-visible:ring-rose-500' : ''
                              }`}
                              placeholder={declared.toString()}
                              value={currentDraft}
                              onChange={e =>
                                setDraftScores(prev => ({ ...prev, [item.id]: e.target.value }))
                              }
                            />
                            <Button
                              size="icon"
                              variant={
                                currentDraft !== (validated?.toString() || '') ? 'default' : 'ghost'
                              }
                              className={`h-8 w-8 ${currentDraft !== (validated?.toString() || '') ? 'bg-primary' : 'text-slate-400'}`}
                              disabled={isSaving || currentDraft === (validated?.toString() || '')}
                              onClick={() => {
                                const val = parseFloat(currentDraft);
                                handleSaveScore(item.id, isNaN(val) ? null : val);
                              }}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {enrollment && (
        <Card className="overflow-hidden rounded-2xl shadow-sm bg-white p-6">
          <ScoreAdjustmentPanel enrollment={enrollment} noCard={true} />
        </Card>
      )}
    </div>
  );
}
