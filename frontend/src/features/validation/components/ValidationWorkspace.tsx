import { useState } from 'react';

import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEnrollment } from '@/features/enrollment/hooks/use-enrollment';
import { ScoreAdjustmentPanel } from '@/features/validation/components/ScoreAdjustmentPanel';
import { ValidationForm } from '@/features/validation/components/ValidationForm';

export function ValidationWorkspace() {
  const { enrollmentId } = useParams({ strict: false });
  const { data: enrollment } = useEnrollment(enrollmentId as string);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);

  // Controle do modal de confirmação
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simula a finalização da avaliação
  const handleFinalize = () => {
    setIsSubmitting(true);
    // TODO: Trocar pela mutation real do TanStack Query (ex: finalizeValidation.mutate())
    setTimeout(() => {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      toast.success('Avaliação finalizada com sucesso!');
      // Idealmente, redirecionar de volta para a listagem aqui
    }, 1500);
  };

  return (
    <div className="anubis-page-shell min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="relative z-10 mx-auto max-w-400 space-y-6">
        {/* Header e Navegação */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground">
              <Link to="/validation">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a listagem
              </Link>
            </Button>
            <h1 className="text-foreground font-serif text-3xl font-bold tracking-tight">
              Revisão de Currículo
            </h1>
            <p className="text-muted-foreground text-sm">
              Inscrição: <span className="font-mono text-slate-500">{enrollmentId}</span>
            </p>
          </div>

          <Button
            className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            onClick={() => setIsConfirmOpen(true)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar Avaliação
          </Button>
        </div>

        {/* Layout Split-Screen */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <ValidationForm enrollmentId={enrollmentId as string} onSelectPdf={setSelectedPdfUrl} />
            {enrollment && <ScoreAdjustmentPanel enrollment={enrollment} />}
          </div>

          <div className="sticky top-8 flex h-[calc(100vh-8rem)] flex-col gap-4">
            <Card className="flex flex-1 flex-col overflow-hidden rounded-3x1 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 p-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-label text-xs uppercase tracking-wider text-slate-500">
                  Arquivos Anexos
                </span>
              </div>
              <CardContent className="flex flex-1 items-center justify-center bg-slate-100/50 p-0">
                {selectedPdfUrl ? (
                  <iframe
                    src={`${selectedPdfUrl}#toolbar=0`}
                    className="h-full w-full border-0"
                    title="Visualizador de PDF"
                  />
                ) : (
                  <div className="space-y-3 p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="text-muted-foreground max-w-50 text-sm leading-relaxed">
                      Selecione um comprovante na lista ao lado para visualizá-lo aqui.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Avaliação</DialogTitle>
            <DialogDescription>
              Você está prestes a concluir a avaliação deste candidato. Certifique-se de que revisou
              todos os itens do currículo.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            <strong>Atenção:</strong> Após a finalização, a nota será consolidada e você não poderá
            mais alterar os valores.
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Revisar mais um pouco
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleFinalize}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Sim, confirmar notas'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
