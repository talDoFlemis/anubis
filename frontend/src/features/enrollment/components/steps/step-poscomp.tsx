import { useState } from 'react';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/features/enrollment/components/file-upload-field';
import { useUpdateEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod, PoscompData } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Props ────────────────────────────────────────────────────────────

interface StepPoscompProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Component ────────────────────────────────────────────────────────

export function StepPoscomp({ enrollment, period: _period, onNext, onBack }: StepPoscompProps) {
  const updateEnrollment = useUpdateEnrollment();

  // ── State from existing enrollment ───────────────────────────────
  const existingPoscomp = enrollment?.poscomp;

  const [hasPoscomp, setHasPoscomp] = useState(existingPoscomp?.hasPoscomp ?? false);
  const [year, setYear] = useState(existingPoscomp?.year?.toString() ?? '');
  const [mathScore, setMathScore] = useState(existingPoscomp?.mathScore?.toString() ?? '');
  const [fundamentalsScore, setFundamentalsScore] = useState(
    existingPoscomp?.fundamentalsScore?.toString() ?? '',
  );
  const [technologyScore, setTechnologyScore] = useState(
    existingPoscomp?.technologyScore?.toString() ?? '',
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation ───────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (hasPoscomp) {
      const yearNum = Number(year);
      if (!year.trim() || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        newErrors.year = 'Informe um ano válido (ex.: 2025).';
      }

      const math = Number(mathScore);
      if (mathScore.trim() === '' || isNaN(math) || math < 0 || math > 100) {
        newErrors.mathScore = 'Nota deve ser entre 0 e 100.';
      }

      const fundamentals = Number(fundamentalsScore);
      if (
        fundamentalsScore.trim() === '' ||
        isNaN(fundamentals) ||
        fundamentals < 0 ||
        fundamentals > 100
      ) {
        newErrors.fundamentalsScore = 'Nota deve ser entre 0 e 100.';
      }

      const technology = Number(technologyScore);
      if (
        technologyScore.trim() === '' ||
        isNaN(technology) ||
        technology < 0 ||
        technology > 100
      ) {
        newErrors.technologyScore = 'Nota deve ser entre 0 e 100.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────
  function handleNext() {
    if (!validate()) return;
    if (!enrollment) return;

    const poscomp: PoscompData = hasPoscomp
      ? {
          hasPoscomp: true,
          year: Number(year),
          mathScore: Number(mathScore),
          fundamentalsScore: Number(fundamentalsScore),
          technologyScore: Number(technologyScore),
          receiptFileId: existingPoscomp?.receiptFileId ?? undefined,
        }
      : { hasPoscomp: false };

    updateEnrollment.mutate(
      {
        id: enrollment.id,
        payload: { poscomp },
      },
      {
        onSuccess: () => onNext(),
        onError: err => {
          toast.error(err.message || 'Erro ao salvar dados do POSCOMP.');
        },
      },
    );
  }

  function handleTogglePoscomp() {
    setHasPoscomp(prev => !prev);
    setErrors({});
  }

  return (
    <div className="space-y-10">
      {/* ── Section heading ────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">POSCOMP</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Informe se realizou o exame POSCOMP e, em caso positivo, preencha as notas.
        </p>
      </div>

      {/* ── Toggle ─────────────────────────────────────────────── */}
      <div className={cn('bg-surface-dim/40 flex items-center justify-between rounded-2xl p-5')}>
        <div className="space-y-0.5">
          <span className="font-label text-sm font-semibold">Fez o POSCOMP?</span>
          <p className="text-muted-foreground text-xs">Marque se você realizou o exame nacional.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hasPoscomp}
          onClick={handleTogglePoscomp}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            hasPoscomp ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform',
              hasPoscomp ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
      </div>

      {/* ── Conditional fields ─────────────────────────────────── */}
      {hasPoscomp && (
        <div className="space-y-6">
          {/* Year */}
          <Field data-invalid={!!errors.year} className="space-y-2">
            <FieldLabel htmlFor="poscomp-year">Ano</FieldLabel>
            <FieldContent>
              <Input
                id="poscomp-year"
                type="number"
                inputMode="numeric"
                value={year}
                onChange={e => {
                  setYear(e.target.value);
                  setErrors(prev => {
                    const { year: _, ...rest } = prev;
                    return rest;
                  });
                }}
                placeholder="Ex.: 2025"
                aria-invalid={!!errors.year}
              />
              {errors.year && <FieldError>{errors.year}</FieldError>}
            </FieldContent>
          </Field>

          {/* Score fields */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!errors.mathScore} className="space-y-2">
              <FieldLabel htmlFor="poscomp-math">Nota Matemática</FieldLabel>
              <FieldContent>
                <Input
                  id="poscomp-math"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={100}
                  value={mathScore}
                  onChange={e => {
                    setMathScore(e.target.value);
                    setErrors(prev => {
                      const { mathScore: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  placeholder="0 – 100"
                  aria-invalid={!!errors.mathScore}
                />
                {errors.mathScore && <FieldError>{errors.mathScore}</FieldError>}
              </FieldContent>
            </Field>

            <Field data-invalid={!!errors.fundamentalsScore} className="space-y-2">
              <FieldLabel htmlFor="poscomp-fundamentals">Nota Fundamentos</FieldLabel>
              <FieldContent>
                <Input
                  id="poscomp-fundamentals"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={100}
                  value={fundamentalsScore}
                  onChange={e => {
                    setFundamentalsScore(e.target.value);
                    setErrors(prev => {
                      const { fundamentalsScore: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  placeholder="0 – 100"
                  aria-invalid={!!errors.fundamentalsScore}
                />
                {errors.fundamentalsScore && <FieldError>{errors.fundamentalsScore}</FieldError>}
              </FieldContent>
            </Field>

            <Field data-invalid={!!errors.technologyScore} className="space-y-2">
              <FieldLabel htmlFor="poscomp-technology">Nota Tecnologia</FieldLabel>
              <FieldContent>
                <Input
                  id="poscomp-technology"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={100}
                  value={technologyScore}
                  onChange={e => {
                    setTechnologyScore(e.target.value);
                    setErrors(prev => {
                      const { technologyScore: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  placeholder="0 – 100"
                  aria-invalid={!!errors.technologyScore}
                />
                {errors.technologyScore && <FieldError>{errors.technologyScore}</FieldError>}
              </FieldContent>
            </Field>
          </div>

          {/* Receipt upload */}
          <FileUploadField
            accept=".pdf"
            label="Comprovante POSCOMP"
            value={receiptFile}
            existingFileName={existingPoscomp?.receiptFileId ? 'Comprovante enviado' : null}
            onChange={setReceiptFile}
          />
        </div>
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

        <Button
          type="button"
          onClick={handleNext}
          disabled={updateEnrollment.isPending}
          className="min-w-32"
        >
          {updateEnrollment.isPending ? (
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
