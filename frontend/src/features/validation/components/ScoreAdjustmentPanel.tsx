import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Enrollment } from '@/lib/api';
import { Edit3, Loader2, Lock, Save, Trash2, Unlock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateScoreAdjustment,
  useDeleteScoreAdjustment,
  useLockScoreAdjustments,
  useScoreAdjustments,
} from '../hooks/use-score-adjustments';

interface ScoreAdjustmentPanelProps {
  enrollment: Enrollment;
  noCard?: boolean;
}

export function ScoreAdjustmentPanel({ enrollment, noCard = false }: ScoreAdjustmentPanelProps) {
  const { data: adjustments = [], isLoading } = useScoreAdjustments(enrollment.id);
  const createMutation = useCreateScoreAdjustment();
  const deleteMutation = useDeleteScoreAdjustment();
  const lockMutation = useLockScoreAdjustments();

  // Active inputs
  const [editingType, setEditingType] = useState<'cv_score' | 'ira' | 'final' | null>(null);
  const [valInput, setValInput] = useState('');
  const [justInput, setJustInput] = useState('');

  const isLocked =
    adjustments.some(a => a.isLocked) || ['validated', 'classified'].includes(enrollment.status);

  const handleEditClick = (
    type: 'cv_score' | 'ira' | 'final',
    currentVal = '',
    currentJust = '',
  ) => {
    setEditingType(type);
    setValInput(currentVal);
    setJustInput(currentJust);
  };

  const handleSave = async (type: 'cv_score' | 'ira' | 'final') => {
    const val = parseFloat(valInput);
    if (isNaN(val)) {
      toast.error('Informe um valor numérico válido.');
      return;
    }
    if (!justInput.trim()) {
      toast.error('Justificativa é obrigatória para o ajuste.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        enrollmentId: enrollment.id,
        payload: {
          scoreType: type,
          adjustedValue: val,
          justification: justInput.trim(),
        },
      });
      toast.success('Ajuste salvo com sucesso.');
      setEditingType(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar ajuste.');
    }
  };

  const handleDelete = async (type: 'cv_score' | 'ira' | 'final') => {
    try {
      await deleteMutation.mutateAsync({
        enrollmentId: enrollment.id,
        scoreType: type,
      });
      toast.success('Ajuste removido.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover ajuste.');
    }
  };

  const handleLock = async () => {
    try {
      await lockMutation.mutateAsync(enrollment.id);
      toast.success('Ajustes bloqueados com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao bloquear ajustes.');
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-slate-50/50 p-6 flex items-center justify-center min-h-40">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando painel de ajustes...</span>
        </div>
      </Card>
    );
  }

  const cvAdj = adjustments.find(a => a.scoreType === 'cv_score');
  const iraAdj = adjustments.find(a => a.scoreType === 'ira');
  const finalAdj = adjustments.find(a => a.scoreType === 'final');

  const rows = [
    {
      type: 'ira' as const,
      label: 'Nota de Graduação (IRA)',
      original: enrollment.ira ? Number(enrollment.ira).toFixed(2) : '0.00',
      adjustment: iraAdj,
    },
    {
      type: 'cv_score' as const,
      label: 'Nota de Currículo (CV)',
      original: enrollment.scoreDraft ? Number(enrollment.scoreDraft).toFixed(2) : '0.00',
      adjustment: cvAdj,
    },
    {
      type: 'final' as const,
      label: 'Nota Final',
      original: enrollment.scoreDraft ? 'Calculado na Classificação' : '0.00',
      adjustment: finalAdj,
    },
  ];

  if (noCard) {
    return (
      <div className="pt-6 border-t border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-800">
              Ajustes Granulares de Notas
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              Override manual de notas com justificativa de acordo com a validação.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 hover:bg-amber-50 font-medium rounded-lg px-2.5 py-1 text-xs gap-1.5 border border-amber-200"
              >
                <Lock className="h-3.5 w-3.5" />
                Bloqueado
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-medium rounded-lg px-2.5 py-1 text-xs gap-1.5 border border-emerald-200"
              >
                <Unlock className="h-3.5 w-3.5" />
                Edição Ativa
              </Badge>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100/80">
          {rows.map(({ type, label, original, adjustment }) => {
            const isEditing = editingType === type;
            const hasAdj = !!adjustment;

            return (
              <div key={type} className="py-5 first:pt-0 last:pb-0 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800">{label}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                      <span>
                        Original: <span className="font-mono text-slate-600">{original}</span>
                      </span>
                      {hasAdj && (
                        <span className="text-primary bg-primary/5 px-2 py-0.5 rounded">
                          Ajustado para:{' '}
                          <span className="font-mono font-bold">
                            {Number(adjustment.adjustedValue).toFixed(2)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isLocked && !isEditing && (
                      <>
                        {hasAdj && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(type)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                            title="Remover ajuste"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleEditClick(
                              type,
                              hasAdj ? adjustment.adjustedValue : '',
                              hasAdj ? adjustment.justification : '',
                            )
                          }
                          className="rounded-xl h-8 text-xs font-semibold gap-1.5"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {hasAdj ? 'Editar' : 'Ajustar'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {hasAdj && !isEditing && (
                  <div className="bg-slate-50/50 rounded-xl p-3.5 text-xs border border-slate-100 text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700">Justificativa do ajuste:</p>
                    <p className="leading-relaxed font-normal">{adjustment.justification}</p>
                  </div>
                )}

                {isEditing && (
                  <div className="bg-slate-50/40 border border-slate-100 rounded-2xl p-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-[1fr_2.5fr]">
                      <Field className="space-y-1">
                        <FieldLabel htmlFor={`val-${type}`} className="text-xs">
                          Nova Nota
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            id={`val-${type}`}
                            type="number"
                            step="0.01"
                            placeholder="Ex.: 9.25"
                            value={valInput}
                            onChange={e => setValInput(e.target.value)}
                            className="h-9 font-mono"
                          />
                        </FieldContent>
                      </Field>

                      <Field className="space-y-1">
                        <FieldLabel htmlFor={`just-${type}`} className="text-xs">
                          Justificativa
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            id={`just-${type}`}
                            placeholder="Justifique a alteração da nota..."
                            value={justInput}
                            onChange={e => setJustInput(e.target.value)}
                            className="h-9"
                          />
                        </FieldContent>
                      </Field>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingType(null)}
                        className="rounded-xl h-8 text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(type)}
                        disabled={createMutation.isPending}
                        className="rounded-xl h-8 text-xs gap-1"
                      >
                        {createMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Salvar Ajuste
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isLocked && adjustments.length > 0 && (
          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleLock}
              disabled={lockMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 text-xs font-semibold gap-1.5"
            >
              {lockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Bloquear e Consolidar Ajustes
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white mt-8">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
        <div>
          <CardTitle className="text-lg text-slate-800 font-serif font-bold">
            Ajustes Granulares de Notas
          </CardTitle>
          <p className="text-muted-foreground text-xs mt-1">
            Override manual de notas com justificativa de acordo com a validação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Badge
              variant="secondary"
              className="bg-amber-50 text-amber-700 hover:bg-amber-50 font-medium rounded-lg px-2.5 py-1 text-xs gap-1.5 border border-amber-200"
            >
              <Lock className="h-3.5 w-3.5" />
              Bloqueado
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-medium rounded-lg px-2.5 py-1 text-xs gap-1.5 border border-emerald-200"
            >
              <Unlock className="h-3.5 w-3.5" />
              Edição Ativa
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 divide-y divide-slate-100/80">
        {rows.map(({ type, label, original, adjustment }) => {
          const isEditing = editingType === type;
          const hasAdj = !!adjustment;

          return (
            <div key={type} className="py-5 first:pt-0 last:pb-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800">{label}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                    <span>
                      Original: <span className="font-mono text-slate-600">{original}</span>
                    </span>
                    {hasAdj && (
                      <span className="text-primary bg-primary/5 px-2 py-0.5 rounded">
                        Ajustado para:{' '}
                        <span className="font-mono font-bold">
                          {Number(adjustment.adjustedValue).toFixed(2)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isLocked && !isEditing && (
                    <>
                      {hasAdj && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                          title="Remover ajuste"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleEditClick(
                            type,
                            hasAdj ? adjustment.adjustedValue : '',
                            hasAdj ? adjustment.justification : '',
                          )
                        }
                        className="rounded-xl h-8 text-xs font-semibold gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {hasAdj ? 'Editar' : 'Ajustar'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Justification details */}
              {hasAdj && !isEditing && (
                <div className="bg-slate-50/50 rounded-xl p-3.5 text-xs border border-slate-100 text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">Justificativa do ajuste:</p>
                  <p className="leading-relaxed font-normal">{adjustment.justification}</p>
                </div>
              )}

              {/* Form editing layout */}
              {isEditing && (
                <div className="bg-slate-50/40 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_2.5fr]">
                    <Field className="space-y-1">
                      <FieldLabel htmlFor={`val-${type}`} className="text-xs">
                        Nova Nota
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={`val-${type}`}
                          type="number"
                          step="0.01"
                          placeholder="Ex.: 9.25"
                          value={valInput}
                          onChange={e => setValInput(e.target.value)}
                          className="h-9 font-mono"
                        />
                      </FieldContent>
                    </Field>

                    <Field className="space-y-1">
                      <FieldLabel htmlFor={`just-${type}`} className="text-xs">
                        Justificativa
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={`just-${type}`}
                          placeholder="Justifique a alteração da nota..."
                          value={justInput}
                          onChange={e => setJustInput(e.target.value)}
                          className="h-9"
                        />
                      </FieldContent>
                    </Field>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingType(null)}
                      className="rounded-xl h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(type)}
                      disabled={createMutation.isPending}
                      className="rounded-xl h-8 text-xs gap-1"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Salvar Ajuste
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Lock adjustments button */}
        {!isLocked && adjustments.length > 0 && (
          <div className="pt-5 flex justify-end">
            <Button
              onClick={handleLock}
              disabled={lockMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 text-xs font-semibold gap-1.5"
            >
              {lockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Bloquear e Consolidar Ajustes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
