import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft, ExternalLink, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { FileUploadField } from '@/features/enrollment/components/file-upload-field';
import {
  useSubmitEnrollment,
  useUpdateEnrollment,
} from '@/features/enrollment/hooks/use-enrollment';
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

// ── Component ────────────────────────────────────────────────────────

export function StepSigaa({ enrollment, onBack }: StepSigaaProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateEnrollment = useUpdateEnrollment();
  const submitEnrollment = useSubmitEnrollment();

  const [sigaaCode, setSigaaCode] = useState(enrollment?.sigaaCode ?? '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

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

  const isPending = updateEnrollment.isPending || uploadReceipt.isPending || submitEnrollment.isPending;

  async function handleSaveAndSubmit() {
    if (!validate()) return;
    if (!enrollment) return;

    setShowSubmitDialog(true);
  }

  async function handleConfirmSubmit() {
    if (!enrollment) return;

    try {
      // Save sigaaCode
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: { sigaaCode: sigaaCode.trim() },
      });

      // Upload receipt file if selected
      if (receiptFile) {
        await uploadReceipt.mutateAsync({
          enrollmentId: enrollment.id,
          file: receiptFile,
        });
      }

      // Submit enrollment
      submitEnrollment.mutate(enrollment.id, {
        onSuccess: () => {
          toast.success('Inscrição submetida com sucesso!');
          setShowSubmitDialog(false);
          navigate({ to: '/enrollment' });
        },
        onError: err => {
          toast.error(err.message || 'Erro ao submeter inscrição.');
          setShowSubmitDialog(false);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar dados do SIGAA.';
      toast.error(message);
      setShowSubmitDialog(false);
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
              href="https://sigaa.ufrn.br"
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

        <Button
          type="button"
          onClick={handleSaveAndSubmit}
          disabled={isPending}
          className="anubis-gradient-action min-w-44 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Finalizar e Submeter'
          )}
        </Button>
      </div>

      {/* ── Submit confirmation dialog ──────────────────────────── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-primary h-5 w-5" />
              Submeter inscrição
            </DialogTitle>
            <DialogDescription>
              Após a submissão, você não poderá mais editar sua inscrição. Certifique-se de que todos
              os dados e documentos estão corretos antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="anubis-gradient-action text-white"
              onClick={handleConfirmSubmit}
              disabled={isPending}
            >
              {isPending ? (
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
