import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NovoDocenteFormData, NovoDocenteFormErrors } from '../types/professors-form.types';

interface CreateProfessorDialogProps {
  open: boolean;
  formData: NovoDocenteFormData;
  formErrors: NovoDocenteFormErrors;
  linhasPesquisa: readonly string[];
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onNomeCompletoChange: (value: string) => void;
  onCpfChange: (value: string) => void;
  onMatriculaChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onInstituicaoChange: (value: string) => void;
  onLinhaPesquisaChange: (value: string) => void;
}

export function CreateProfessorDialog({
  open,
  formData,
  formErrors,
  linhasPesquisa,
  onClose,
  onSubmit,
  onNomeCompletoChange,
  onCpfChange,
  onMatriculaChange,
  onEmailChange,
  onInstituicaoChange,
  onLinhaPesquisaChange,
}: CreateProfessorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="p-6 sm:max-w-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-serif text-xl font-bold text-slate-900">
            Cadastrar Novo Docente
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            {
              'Preencha os dados para incluir o docente no sistema. O docente receberá um e-mail para ativar o acesso e criar sua senha.'
            }
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Nome completo
            </p>
            <Input
              value={formData.nomeCompleto}
              onChange={event => onNomeCompletoChange(event.target.value)}
              placeholder="Ex.: Maria da Silva"
            />
            {formErrors.nomeCompleto ? (
              <p className="text-xs text-red-600">{formErrors.nomeCompleto}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">CPF</p>
              <Input
                inputMode="numeric"
                value={formData.cpf}
                onChange={event => onCpfChange(event.target.value)}
                maxLength={11}
                placeholder="Somente numeros"
              />
              {formErrors.cpf ? <p className="text-xs text-red-600">{formErrors.cpf}</p> : null}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Matricula do docente
              </p>
              <Input
                value={formData.matriculaDocente}
                onChange={event => onMatriculaChange(event.target.value)}
                placeholder="Ex.: DOC-2026-001"
              />
              {formErrors.matriculaDocente ? (
                <p className="text-xs text-red-600">{formErrors.matriculaDocente}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">E-mail</p>
              <Input
                type="email"
                value={formData.email}
                onChange={event => onEmailChange(event.target.value)}
                placeholder="nome@instituicao.br"
              />
              {formErrors.email ? <p className="text-xs text-red-600">{formErrors.email}</p> : null}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Instituicao de origem
              </p>
              <Input
                value={formData.instituicaoOrigem}
                onChange={event => onInstituicaoChange(event.target.value)}
                placeholder="Ex.: UFC"
              />
              {formErrors.instituicaoOrigem ? (
                <p className="text-xs text-red-600">{formErrors.instituicaoOrigem}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Linha de pesquisa principal
            </p>
            <Select value={formData.linhaPesquisaPrincipal} onValueChange={onLinhaPesquisaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma linha de pesquisa" />
              </SelectTrigger>
              <SelectContent>
                {linhasPesquisa.map(linha => (
                  <SelectItem key={linha} value={linha}>
                    {linha}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.linhaPesquisaPrincipal ? (
              <p className="text-xs text-red-600">{formErrors.linhaPesquisaPrincipal}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 font-medium text-white hover:bg-blue-700">
              Salvar Cadastro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
