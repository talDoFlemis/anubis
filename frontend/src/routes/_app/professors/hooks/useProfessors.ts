import * as React from 'react';
import { toast } from 'sonner';

import { mockDocentes, type Docente } from '@/lib/mock-professors-management';
import {
  INITIAL_NOVO_DOCENTE_FORM,
  type NovoDocenteFormData,
  type NovoDocenteFormErrors,
} from '../types/professors-form.types';
import {
  createDocenteId,
  normalizeCpf,
  validateNovoDocenteForm,
} from '../utils/professors-form.utils';

export function useProfessors() {
  const [docentes, setDocentes] = React.useState<Docente[]>(mockDocentes);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [cadastroAberto, setCadastroAberto] = React.useState(false);
  const [novoDocenteForm, setNovoDocenteForm] =
    React.useState<NovoDocenteFormData>(INITIAL_NOVO_DOCENTE_FORM);
  const [novoDocenteFormErrors, setNovoDocenteFormErrors] = React.useState<NovoDocenteFormErrors>(
    {},
  );
  const [docenteParaReenvio, setDocenteParaReenvio] = React.useState<Docente | null>(null);
  const [docenteParaAcoes, setDocenteParaAcoes] = React.useState<Docente | null>(null);

  const docentesFiltrados = React.useMemo(
    () => docentes.filter(d => d.nome.toLowerCase().includes(searchQuery.toLowerCase())),
    [docentes, searchQuery],
  );

  const handleOpenCadastro = () => {
    setCadastroAberto(true);
  };

  const handleCloseCadastro = () => {
    setCadastroAberto(false);
    setNovoDocenteForm(INITIAL_NOVO_DOCENTE_FORM);
    setNovoDocenteFormErrors({});
  };

  const handleFieldChange = <K extends keyof NovoDocenteFormData>(
    field: K,
    value: NovoDocenteFormData[K],
  ) => {
    setNovoDocenteForm(current => ({ ...current, [field]: value }));
  };

  const handleCpfChange = (value: string) => {
    handleFieldChange('cpf', normalizeCpf(value).slice(0, 11));
  };

  const handleSalvarCadastro = (event: React.FormEvent) => {
    event.preventDefault();

    const errors = validateNovoDocenteForm(novoDocenteForm);
    setNovoDocenteFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const novoDocente: Docente = {
      id: createDocenteId(),
      nome: novoDocenteForm.nomeCompleto.trim(),
      cpf: normalizeCpf(novoDocenteForm.cpf),
      matriculaDocente: novoDocenteForm.matriculaDocente.trim(),
      tipo: 'DOCENTE PERMANENTE',
      email: novoDocenteForm.email.trim().toLowerCase(),
      instituicaoOrigem: novoDocenteForm.instituicaoOrigem.trim(),
      linhaPesquisaPrincipal: novoDocenteForm.linhaPesquisaPrincipal,
      status: 'Pendente',
    };

    setDocentes(current => [novoDocente, ...current]);
    toast.success('Cadastro de docente salvo com sucesso.');
    handleCloseCadastro();
  };

  const handleOpenReenvio = (docente: Docente) => {
    setDocenteParaReenvio(docente);
  };

  const handleCloseReenvio = () => {
    setDocenteParaReenvio(null);
  };

  const handleReenviarConvite = () => {
    toast.success(`Convite reenviado para ${docenteParaReenvio?.email}.`);
    handleCloseReenvio();
  };

  const handleOpenAcoes = (docente: Docente) => {
    setDocenteParaAcoes(docente);
  };

  const handleCloseAcoes = () => {
    setDocenteParaAcoes(null);
  };

  const handleToggleDocenteStatus = () => {
    if (!docenteParaAcoes) {
      return;
    }

    setDocentes(current =>
      current.map(docente => {
        if (docente.id !== docenteParaAcoes.id) {
          return docente;
        }

        return {
          ...docente,
          status: docente.status === 'Desativado' ? 'Verificado' : 'Desativado',
        };
      }),
    );

    toast.success(
      docenteParaAcoes.status === 'Desativado'
        ? `Docente ${docenteParaAcoes.nome} ativado com sucesso.`
        : `Docente ${docenteParaAcoes.nome} desativado com sucesso.`,
    );
    handleCloseAcoes();
  };

  const handleRedefinirSenha = () => {
    if (!docenteParaAcoes) {
      return;
    }

    toast.success(`Solicitação de redefinição de senha enviada para ${docenteParaAcoes.email}.`);
    handleCloseAcoes();
  };

  return {
    docentesFiltrados,
    searchQuery,
    cadastroAberto,
    novoDocenteForm,
    novoDocenteFormErrors,
    docenteParaReenvio,
    docenteParaAcoes,
    setSearchQuery,
    handleOpenCadastro,
    handleCloseCadastro,
    handleFieldChange,
    handleCpfChange,
    handleSalvarCadastro,
    handleOpenReenvio,
    handleCloseReenvio,
    handleReenviarConvite,
    handleOpenAcoes,
    handleCloseAcoes,
    handleToggleDocenteStatus,
    handleRedefinirSenha,
  };
}
