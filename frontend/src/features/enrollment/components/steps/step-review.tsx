import { useState } from 'react';

import { Link, useNavigate } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft, Check, Loader2, Pencil, X } from 'lucide-react';
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
import { BASE_CV_SCORE } from '@/features/enrollment/hooks/use-cv-scoring';
import {
  useResearchThemes,
  useSubmitEnrollment,
  useUpdateEnrollment,
} from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Props ────────────────────────────────────────────────────────────

interface StepReviewProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

const DEGREE_TYPE_LABELS: Record<string, string> = {
  bacharelado: 'Bacharelado',
  licenciatura: 'Licenciatura',
  tecnologo: 'Tecnólogo',
};

type StepRoute =
  | '/enrollment/new/level'
  | '/enrollment/new/themes'
  | '/enrollment/new/academic'
  | '/enrollment/new/poscomp'
  | '/enrollment/new/cv'
  | '/enrollment/new/sigaa';

// ── Small presentational helpers ─────────────────────────────────────

function StatusBadge({ ok, okLabel = 'Enviado' }: { ok: boolean; okLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
      )}
    >
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {ok ? okLabel : 'Pendente'}
    </span>
  );
}

function ReviewSection({
  title,
  editTo,
  children,
}: {
  title: string;
  editTo: StepRoute;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-dim/40 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold tracking-tight">{title}</h3>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
          <Link to={editTo}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
        </Button>
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────

export function StepReview({ enrollment, onBack }: StepReviewProps) {
  const navigate = useNavigate();
  const updateEnrollment = useUpdateEnrollment();
  const submitEnrollment = useSubmitEnrollment();

  const { data: themesResponse } = useResearchThemes(enrollment?.level as 'masters' | 'doctoral');
  const themes = themesResponse?.data ?? [];
  const themeTitle = (id: string | null) =>
    id ? (themes.find(t => t.id === id)?.title ?? 'Tema não encontrado') : null;

  const [declaration, setDeclaration] = useState(enrollment?.declaration ?? false);
  const [declarationError, setDeclarationError] = useState<string | null>(null);
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const isPending = updateEnrollment.isPending || submitEnrollment.isPending;
  const isDoctoral = enrollment?.level === 'doctoral';

  function handleFinalize() {
    if (!enrollment) return;
    if (!declaration) {
      setDeclarationError('Você deve aceitar a declaração de veracidade.');
      return;
    }
    setShowSubmitDialog(true);
  }

  async function handleConfirmSubmit() {
    if (!enrollment) return;

    try {
      setSubmissionErrors([]);

      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: { declaration },
      });

      submitEnrollment.mutate(enrollment.id, {
        onSuccess: () => {
          toast.success('Inscrição submetida com sucesso!');
          setShowSubmitDialog(false);
          navigate({ to: '/enrollment' });
        },
        onError: err => {
          toast.error('Não foi possível submeter a inscrição. Verifique as pendências.');
          const rawMsg =
            err && typeof err === 'object' && 'message' in err
              ? (err as { message: string }).message
              : '';
          if (typeof rawMsg === 'string' && rawMsg) {
            setSubmissionErrors(rawMsg.split('. ').filter(Boolean));
          }
          setShowSubmitDialog(false);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao submeter a inscrição.';
      toast.error(message);
      setShowSubmitDialog(false);
    }
  }

  if (!enrollment) {
    return (
      <p className="text-muted-foreground text-sm">Nenhuma inscrição em rascunho encontrada.</p>
    );
  }

  const poscomp = enrollment.poscomp;

  return (
    <div className="space-y-8">
      {/* ── Heading ────────────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Revisão da inscrição</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Confira todas as informações antes de submeter. Após a submissão não será possível editar.
        </p>
      </div>

      {/* ── Submission errors ──────────────────────────────────── */}
      {submissionErrors.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-destructive/10 p-5 text-sm text-destructive border border-destructive/20">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <span>Existem pendências para a submissão de sua inscrição:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {submissionErrors.map((errText, idx) => (
              <li key={idx}>{errText}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Nível ──────────────────────────────────────────────── */}
      <ReviewSection title="Nível" editTo="/enrollment/new/level">
        <Row label="Nível pretendido" value={isDoctoral ? 'Doutorado' : 'Mestrado'} />
      </ReviewSection>

      {/* ── Temas ──────────────────────────────────────────────── */}
      <ReviewSection title="Temas de pesquisa" editTo="/enrollment/new/themes">
        <Row label="1ª opção" value={themeTitle(enrollment.primaryThemeId) ?? 'Não informado'} />
        <Row label="2ª opção" value={themeTitle(enrollment.secondaryThemeId) ?? 'Não informado'} />
      </ReviewSection>

      {/* ── Graduação ──────────────────────────────────────────── */}
      <ReviewSection title="Graduação" editTo="/enrollment/new/academic">
        <Row label="Universidade" value={enrollment.undergradUniversity ?? 'Não informado'} />
        <Row label="Curso" value={enrollment.undergradCourse ?? 'Não informado'} />
        <Row
          label="Tipo"
          value={
            enrollment.undergradDegreeType
              ? (DEGREE_TYPE_LABELS[enrollment.undergradDegreeType] ??
                enrollment.undergradDegreeType)
              : 'Não informado'
          }
        />
        <Row label="IRA" value={enrollment.ira ?? 'Não informado'} />
        <Row label="Comprovante" value={<StatusBadge ok={!!enrollment.undergradProofFileId} />} />
      </ReviewSection>

      {/* ── POSCOMP ────────────────────────────────────────────── */}
      <ReviewSection title="POSCOMP" editTo="/enrollment/new/poscomp">
        {poscomp?.hasPoscomp ? (
          <>
            <Row label="Ano" value={poscomp.year ?? '—'} />
            <Row label="Matemática" value={poscomp.mathScore ?? '—'} />
            <Row label="Fundamentos" value={poscomp.fundamentalsScore ?? '—'} />
            <Row label="Tecnologia" value={poscomp.technologyScore ?? '—'} />
            <Row label="Comprovante" value={<StatusBadge ok={!!poscomp.receiptFileId} />} />
          </>
        ) : (
          <Row label="Possui POSCOMP" value="Não informado" />
        )}
      </ReviewSection>

      {/* ── Mestrados + Projeto (doctoral only) ─────────────────── */}
      {isDoctoral && (
        <ReviewSection title="Mestrado e projeto" editTo="/enrollment/new/academic">
          {(enrollment.mastersDegrees ?? []).length > 0 ? (
            (enrollment.mastersDegrees ?? []).map((md, idx) => (
              <div key={idx} className="rounded-xl bg-surface-low/60 p-3 space-y-1">
                <Row
                  label={`Mestrado ${idx + 1}${md.isPrimary ? ' (principal)' : ''}`}
                  value={`${md.university} — ${md.graduateProgram}`}
                />
                <Row label="IRA" value={md.ira} />
                <Row label="Comprovante" value={<StatusBadge ok={!!md.proofFileId} />} />
              </div>
            ))
          ) : (
            <Row label="Mestrados" value="Não informado" />
          )}
          <Row label="Título do projeto" value={enrollment.projectTitle ?? 'Não informado'} />
          <Row label="Arquivo do projeto" value={<StatusBadge ok={!!enrollment.projectFileId} />} />
        </ReviewSection>
      )}

      {/* ── Currículo ──────────────────────────────────────────── */}
      <ReviewSection title="Currículo" editTo="/enrollment/new/cv">
        <Row
          label="Pontuação parcial"
          value={enrollment.scoreDraft != null ? enrollment.scoreDraft : BASE_CV_SCORE.toFixed(2)}
        />
      </ReviewSection>

      {/* ── SIGAA ──────────────────────────────────────────────── */}
      <ReviewSection title="SIGAA" editTo="/enrollment/new/sigaa">
        <Row label="Número de inscrição" value={enrollment.sigaaCode ?? 'Não informado'} />
        <Row label="Comprovante" value={<StatusBadge ok={!!enrollment.sigaaReceiptFileId} />} />
      </ReviewSection>

      {/* ── Declaration ────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl bg-surface-dim/30 p-5 border border-slate-200/50">
        <input
          id="declaration-checkbox"
          type="checkbox"
          checked={declaration}
          onChange={e => {
            setDeclaration(e.target.checked);
            setDeclarationError(null);
          }}
          className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
        />
        <label
          htmlFor="declaration-checkbox"
          className="text-sm leading-relaxed text-muted-foreground select-none cursor-pointer"
        >
          Declaro para os devidos fins que as informações prestadas nesta inscrição e os documentos
          enviados são verídicos e autênticos, estando ciente de que qualquer falsidade sujeitará o
          candidato às sanções cabíveis.
        </label>
      </div>
      {declarationError && <p className="text-destructive text-sm">{declarationError}</p>}

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
          onClick={handleFinalize}
          disabled={isPending}
          className="anubis-gradient-action min-w-44 text-white font-medium"
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

      {/* ── Submit confirmation dialog ─────────────────────────── */}
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
