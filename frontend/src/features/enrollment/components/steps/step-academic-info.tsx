import { useState } from 'react';

import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  useUpdateEnrollment,
  useUpdateMastersDegrees,
} from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod, MastersDegreeData } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Props ────────────────────────────────────────────────────────────

interface StepAcademicInfoProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Masters degree entry helpers ─────────────────────────────────────

interface MastersDegreeEntry {
  university: string;
  graduateProgram: string;
  ira: string;
  isPrimary: boolean;
}

function createEmptyEntry(isPrimary = false): MastersDegreeEntry {
  return { university: '', graduateProgram: '', ira: '', isPrimary };
}

const JUSTIFICATION_MAX_LENGTH = 2000;

// ── Component ────────────────────────────────────────────────────────

export function StepAcademicInfo({ enrollment, period, onNext, onBack }: StepAcademicInfoProps) {
  const updateEnrollment = useUpdateEnrollment();
  const updateMastersDegrees = useUpdateMastersDegrees();

  const isDoctoralLevel = (enrollment?.level ?? period.level) === 'doutorado';

  // ── Local state ──────────────────────────────────────────────────
  const [phone, setPhone] = useState(enrollment?.phone ?? '');
  const [justification, setJustification] = useState(enrollment?.justification ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Masters degrees state (doctoral only) ────────────────────────
  const [mastersDegrees, setMastersDegrees] = useState<MastersDegreeEntry[]>(() => {
    if (enrollment?.mastersDegrees?.length) {
      return enrollment.mastersDegrees.map(md => ({
        university: md.university,
        graduateProgram: md.graduateProgram,
        ira: String(md.ira),
        isPrimary: md.isPrimary,
      }));
    }
    return isDoctoralLevel ? [createEmptyEntry(true)] : [];
  });

  // ── Masters degree list operations ───────────────────────────────
  function addMastersDegreeEntry() {
    setMastersDegrees(prev => [...prev, createEmptyEntry()]);
  }

  function removeMastersDegreeEntry(index: number) {
    setMastersDegrees(prev => {
      const next = prev.filter((_, i) => i !== index);
      // Ensure at least one entry and one primary
      if (next.length > 0 && !next.some(e => e.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }

  function updateMastersEntry(
    index: number,
    field: keyof MastersDegreeEntry,
    value: string | boolean,
  ) {
    setMastersDegrees(prev =>
      prev.map((entry, i) => {
        if (i !== index) {
          // If toggling primary, unset others
          if (field === 'isPrimary' && value === true) {
            return { ...entry, isPrimary: false };
          }
          return entry;
        }
        return { ...entry, [field]: value };
      }),
    );
  }

  // ── Validation ───────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    }

    if (!justification.trim()) {
      newErrors.justification = 'Justificativa é obrigatória.';
    } else if (justification.length > JUSTIFICATION_MAX_LENGTH) {
      newErrors.justification = `Justificativa não pode exceder ${JUSTIFICATION_MAX_LENGTH} caracteres.`;
    }

    if (isDoctoralLevel) {
      if (mastersDegrees.length === 0) {
        newErrors.mastersDegrees = 'Pelo menos um mestrado é obrigatório.';
      } else {
        const hasPrimary = mastersDegrees.some(e => e.isPrimary);
        if (!hasPrimary) {
          newErrors.mastersDegrees = 'Exatamente um mestrado deve ser marcado como principal.';
        }

        mastersDegrees.forEach((entry, i) => {
          if (!entry.university.trim()) {
            newErrors[`masters_${i}_university`] = 'Universidade é obrigatória.';
          }
          if (!entry.graduateProgram.trim()) {
            newErrors[`masters_${i}_graduateProgram`] = 'Programa de pós-graduação é obrigatório.';
          }
          if (!entry.ira.trim() || isNaN(Number(entry.ira))) {
            newErrors[`masters_${i}_ira`] = 'IRA deve ser um número válido.';
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────
  const isPending = updateEnrollment.isPending || updateMastersDegrees.isPending;

  async function handleNext() {
    if (!validate()) return;
    if (!enrollment) return;

    try {
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: {
          phone: phone.trim(),
          justification: justification.trim(),
        },
      });

      if (isDoctoralLevel && mastersDegrees.length > 0) {
        const payload: MastersDegreeData[] = mastersDegrees.map(entry => ({
          university: entry.university.trim(),
          graduateProgram: entry.graduateProgram.trim(),
          ira: Number(entry.ira),
          isPrimary: entry.isPrimary,
        }));
        await updateMastersDegrees.mutateAsync({
          id: enrollment.id,
          payload: { mastersDegrees: payload },
        });
      }

      onNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar dados acadêmicos.';
      toast.error(message);
    }
  }

  return (
    <div className="space-y-10">
      {/* ── Section heading ────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Informações acadêmicas</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Preencha as informações complementares da sua inscrição.
        </p>
      </div>

      {/* ── Phone field ────────────────────────────────────────── */}
      <Field data-invalid={!!errors.phone} className="space-y-2">
        <FieldLabel htmlFor="phone">Telefone</FieldLabel>
        <FieldContent>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => {
              setPhone(e.target.value);
              setErrors(prev => {
                const { phone: _, ...rest } = prev;
                return rest;
              });
            }}
            placeholder="(84) 99999-0000"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </FieldContent>
      </Field>

      {/* ── Justification textarea ─────────────────────────────── */}
      <Field data-invalid={!!errors.justification} className="space-y-2">
        <FieldLabel htmlFor="justification">Justificativa</FieldLabel>
        <FieldContent>
          <textarea
            id="justification"
            value={justification}
            onChange={e => {
              setJustification(e.target.value);
              setErrors(prev => {
                const { justification: _, ...rest } = prev;
                return rest;
              });
            }}
            placeholder="Descreva sua motivação para ingressar no programa..."
            rows={6}
            maxLength={JUSTIFICATION_MAX_LENGTH}
            aria-invalid={!!errors.justification}
            className={cn(
              'anubis-ghost-border text-foreground ring-offset-background placeholder:text-muted-foreground/85 focus-visible:ring-ring flex w-full rounded-2xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'resize-y min-h-32',
            )}
          />
          <div className="flex items-center justify-between">
            {errors.justification ? <FieldError>{errors.justification}</FieldError> : <span />}
            <span className="text-muted-foreground text-xs tabular-nums">
              {justification.length}/{JUSTIFICATION_MAX_LENGTH}
            </span>
          </div>
        </FieldContent>
      </Field>

      {/* ── Masters degrees (doctoral only) ────────────────────── */}
      {isDoctoralLevel && (
        <section className="space-y-5">
          <div>
            <h3 className="font-serif text-xl font-semibold tracking-tight">
              Mestrado(s) concluído(s)
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Adicione os dados do(s) seu(s) mestrado(s). Marque um como principal.
            </p>
          </div>

          {errors.mastersDegrees && (
            <p role="alert" className="text-destructive text-sm">
              {errors.mastersDegrees}
            </p>
          )}

          <div className="space-y-6">
            {mastersDegrees.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  'bg-surface-dim/40 rounded-2xl p-6 space-y-4',
                  entry.isPrimary && 'ring-primary/20 ring-2 ring-inset',
                )}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={entry.isPrimary}
                      onChange={e => updateMastersEntry(index, 'isPrimary', e.target.checked)}
                      className="accent-primary h-4 w-4 rounded"
                    />
                    Principal
                  </label>

                  {mastersDegrees.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMastersDegreeEntry(index)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    data-invalid={!!errors[`masters_${index}_university`]}
                    className="space-y-2"
                  >
                    <FieldLabel htmlFor={`masters-${index}-university`}>Universidade</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`masters-${index}-university`}
                        value={entry.university}
                        onChange={e => updateMastersEntry(index, 'university', e.target.value)}
                        placeholder="Ex.: UFRN"
                        aria-invalid={!!errors[`masters_${index}_university`]}
                      />
                      {errors[`masters_${index}_university`] && (
                        <FieldError>{errors[`masters_${index}_university`]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field
                    data-invalid={!!errors[`masters_${index}_graduateProgram`]}
                    className="space-y-2"
                  >
                    <FieldLabel htmlFor={`masters-${index}-program`}>
                      Programa de pós-graduação
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`masters-${index}-program`}
                        value={entry.graduateProgram}
                        onChange={e => updateMastersEntry(index, 'graduateProgram', e.target.value)}
                        placeholder="Ex.: PPgSC"
                        aria-invalid={!!errors[`masters_${index}_graduateProgram`]}
                      />
                      {errors[`masters_${index}_graduateProgram`] && (
                        <FieldError>{errors[`masters_${index}_graduateProgram`]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!errors[`masters_${index}_ira`]} className="space-y-2">
                    <FieldLabel htmlFor={`masters-${index}-ira`}>IRA</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`masters-${index}-ira`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={entry.ira}
                        onChange={e => updateMastersEntry(index, 'ira', e.target.value)}
                        placeholder="Ex.: 8.75"
                        aria-invalid={!!errors[`masters_${index}_ira`]}
                      />
                      {errors[`masters_${index}_ira`] && (
                        <FieldError>{errors[`masters_${index}_ira`]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addMastersDegreeEntry} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar mestrado
          </Button>
        </section>
      )}

      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <span />
        )}

        <Button type="button" onClick={handleNext} disabled={isPending} className="min-w-32">
          {isPending ? (
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
