import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ProfessorsHeaderProps {
  onOpenCadastro: () => void;
}

export function ProfessorsHeader({ onOpenCadastro }: ProfessorsHeaderProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        SISTEMA MDCC / GESTÃO ADMINISTRATIVA
      </div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-900">
          Gestão de Docentes
        </h1>
        <Button
          className="bg-blue-600 font-medium text-white hover:bg-blue-700"
          onClick={onOpenCadastro}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Cadastrar Novo Docente
        </Button>
      </div>
    </div>
  );
}
