import { Mail } from 'lucide-react';

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

interface ResendInviteDialogProps {
  docente: Docente | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResendInviteDialog({ docente, onClose, onConfirm }: ResendInviteDialogProps) {
  return (
    <Dialog open={Boolean(docente)} onOpenChange={open => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-106.25">
        <DialogHeader className="mb-2">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-slate-900">
                Confirmar Reenvio
              </DialogTitle>
              <DialogDescription className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                AÇÃO ADMINISTRATIVA
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Deseja reenviar o convite de acesso para este docente?
          </p>
          <p className="text-sm leading-relaxed text-slate-500">
            Um novo link de ativação será enviado para o e-mail cadastrado. O link anterior será
            invalidado.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Confirmar Reenvio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
