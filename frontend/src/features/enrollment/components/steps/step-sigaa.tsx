import { useState } from 'react';

import { ArrowLeft, ExternalLink, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/features/enrollment/components/file-upload-field';
import { useUpdateEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod } from '@/lib/api';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ── Props ────────────────────────────────────────────────────────────

interface StepSigaaProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

const SIGAA_URL = 'https://si3.ufc.br/sigaa/public/processo_seletivo/lista.jsf';

// ── Component ────────────────────────────────────────────────────────

export function StepSigaa({ enrollment, onNext, onBack }: StepSigaaProps) {
  const queryClient = useQueryClient();
  const updateEnrollment = useUpdateEnrollment();

  const [sigaaCode, setSigaaCode] = useState(enrollment?.sigaaCode ?? '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uploadReceipt = useMutation({
    mutationFn: async ({ enrollmentId, file }: { enrollmentId: string; file: File }) => {
      return api.enrollments.uploadSigaaReceipt(enrollmentId, file);
    },
    onSuccess: () => {
      if (enrollment) {
        queryClient.invalidateQueries({ queryKey: ['enrollments', enrollment.id] });
        queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
      }
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!sigaaCode.trim()) {
      newErrors.sigaaCode = 'Número de inscrição no SIGAA é obrigatório.';
    }

    if (!enrollment?.sigaaReceiptFileId && !receiptFile) {
      newErrors.receipt = 'Comprovante de inscrição é obrigatório.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const isPending = updateEnrollment.isPending || uploadReceipt.isPending;

  async function handleNext() {
    if (!validate()) return;
    if (!enrollment) return;

    try {
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: { sigaaCode: sigaaCode.trim() },
      });

      if (receiptFile) {
        await uploadReceipt.mutateAsync({ enrollmentId: enrollment.id, file: receiptFile });
      }

      onNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar dados do SIGAA.';
      toast.error(message);
    }
  }

  const hasExistingReceipt = !!enrollment?.sigaaReceiptFileId;

  return (
    <div className="space-y-10">
      {/* ── Section heading ────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Inscrição no SIGAA</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Para completar sua inscrição, é necessário registrar-se no SIGAA (Sistema Integrado de
          Gestão de Atividades Acadêmicas).
        </p>
      </div>

      {/* ── Instructions ───────────────────────────────────────── */}
      <div className="bg-surface-dim/40 space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <FileCheck className="h-5 w-5" />
          </div>
          <span className="font-label text-sm font-semibold">Como fazer</span>
        </div>

        <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Acesse o{' '}
            <a
              href={SIGAA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
            >
              SIGAA <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>Realize sua inscrição no processo seletivo do MDCC</li>
          <li>Anote o número de inscrição gerado pelo sistema</li>
          <li>Faça download do comprovante de inscrição (PDF)</li>
          <li>Preencha os campos abaixo com o número e o comprovante</li>
        </ol>
      </div>

      {/* ── SIGAA code ─────────────────────────────────────────── */}
      <Field data-invalid={!!errors.sigaaCode} className="space-y-2">
        <FieldLabel htmlFor="sigaa-code">Número de inscrição no SIGAA</FieldLabel>
        <FieldContent>
          <Input
            id="sigaa-code"
            value={sigaaCode}
            onChange={e => {
              setSigaaCode(e.target.value);
              setErrors(prev => {
                const { sigaaCode: _, ...rest } = prev;
                return rest;
              });
            }}
            placeholder="Ex.: 2026001234"
            aria-invalid={!!errors.sigaaCode}
          />
          {errors.sigaaCode && <FieldError>{errors.sigaaCode}</FieldError>}
        </FieldContent>
      </Field>

      {/* ── Receipt upload ─────────────────────────────────────── */}
      <div className="space-y-2">
        <FileUploadField
          accept=".pdf"
          label="Comprovante de inscrição"
          value={receiptFile}
          existingFileName={hasExistingReceipt ? 'Comprovante enviado' : null}
          onChange={file => {
            setReceiptFile(file);
            setErrors(prev => {
              const { receipt: _, ...rest } = prev;
              return rest;
            });
          }}
        />
        {errors.receipt && <p className="text-destructive text-sm">{errors.receipt}</p>}
      </div>

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
