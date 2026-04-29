import { KeyRound, ToggleLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Docente } from '@/lib/mock-professors-management';

interface ProfessorActionsDialogProps {
  docente: Docente | null;
  onClose: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}

export function ProfessorActionsDialog({
  docente,
  onClose,
  onToggleStatus,
  onResetPassword,
}: ProfessorActionsDialogProps) {
  return (
    <Dialog open={Boolean(docente)} onOpenChange={open => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-106.25">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-serif text-xl font-bold text-slate-900">
            Ações do docente
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            Escolha a ação que deseja executar para {docente?.nome}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
            onClick={onToggleStatus}
          >
            <ToggleLeft className="mr-2 h-4 w-4 text-slate-500" />
            {docente?.status === 'Desativado' ? 'ATIVAR DOCENTE' : 'DESATIVAR DOCENTE'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
            onClick={onResetPassword}
          >
            <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
            REDEFINIR SENHA
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
