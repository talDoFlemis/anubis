import { useEffect, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/features/enrollment/components/file-upload-field';
import { useUpdateEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod, PoscompData } from '@/lib/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Props ────────────────────────────────────────────────────────────

interface StepPoscompProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Component ────────────────────────────────────────────────────────

export function StepPoscomp({ enrollment, onNext, onBack }: StepPoscompProps) {
  const queryClient = useQueryClient();
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

  // File state
  const hasExistingReceipt = !!existingPoscomp?.receiptFileId;
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [showReplaceFile, setShowReplaceFile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch the existing receipt file name
  useEffect(() => {
    if (hasExistingReceipt && enrollment) {
      api.enrollments
        .getPoscompReceiptInfo(enrollment.id)
        .then(info => {
          setReceiptFileName(info.fileName);
        })
        .catch(() => {});
    }
  }, [hasExistingReceipt, enrollment]);

  const uploadReceipt = useMutation({
    mutationFn: async ({ enrollmentId, file }: { enrollmentId: string; file: File }) => {
      return api.enrollments.uploadPoscompReceipt(enrollmentId, file);
    },
    onSuccess: () => {
      if (enrollment) {
        queryClient.invalidateQueries({ queryKey: ['enrollments', enrollment.id] });
        queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
      }
      toast.success('Comprovante POSCOMP enviado com sucesso.');
      setReceiptFileName(receiptFile?.name ?? null);
      setReceiptFile(null);
      setShowReplaceFile(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao enviar comprovante.');
    },
  });

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
  async function handleNext() {
    if (!validate()) return;
    if (!enrollment) return;

    try {
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

      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: { poscomp },
      });

      // Upload receipt if a new file was selected
      if (receiptFile) {
        await uploadReceipt.mutateAsync({
          enrollmentId: enrollment.id,
          file: receiptFile,
        });
      }

      onNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar dados do POSCOMP.';
      toast.error(message);
    }
  }

  async function handleUploadReceipt() {
    if (!receiptFile || !enrollment) return;

    // Save poscomp data first (required by backend)
    if (!validate()) return;

    const poscomp: PoscompData = {
      hasPoscomp: true,
      year: Number(year),
      mathScore: Number(mathScore),
      fundamentalsScore: Number(fundamentalsScore),
      technologyScore: Number(technologyScore),
      receiptFileId: existingPoscomp?.receiptFileId ?? undefined,
    };

    try {
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: { poscomp },
      });

      await uploadReceipt.mutateAsync({
        enrollmentId: enrollment.id,
        file: receiptFile,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar comprovante.';
      toast.error(message);
    }
  }

  async function handleDownloadReceipt() {
    if (!enrollment) return;
    setIsDownloading(true);
    try {
      const info = await api.enrollments.getPoscompReceiptInfo(enrollment.id);
      window.open(info.url, '_blank');
    } catch {
      toast.error('Erro ao baixar comprovante.');
    } finally {
      setIsDownloading(false);
    }
  }

  function handleTogglePoscomp() {
    setHasPoscomp(prev => !prev);
    setErrors({});
  }

  const isPending = updateEnrollment.isPending || uploadReceipt.isPending;

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
                min={2000}
                max={2100}
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

          {/* Receipt upload / download / replace */}
          <div className="space-y-3">
            {hasExistingReceipt && !showReplaceFile ? (
              /* Existing file: show name + download + replace buttons */
              <div className="bg-surface-dim/40 flex items-center justify-between rounded-2xl p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-label text-sm font-semibold">Comprovante POSCOMP</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {receiptFileName ?? 'Arquivo enviado'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadReceipt}
                    disabled={isDownloading}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplaceFile(true)}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Substituir
                  </Button>
                </div>
              </div>
            ) : (
              /* No file or replacing: show upload field + save button */
              <div className="space-y-3">
                <FileUploadField
                  accept=".pdf"
                  label="Comprovante POSCOMP"
                  value={receiptFile}
                  existingFileName={null}
                  onChange={setReceiptFile}
                />
                {receiptFile && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadReceipt}
                      disabled={uploadReceipt.isPending}
                    >
                      {uploadReceipt.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Salvar comprovante'
                      )}
                    </Button>
                    {showReplaceFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowReplaceFile(false);
                          setReceiptFile(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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
