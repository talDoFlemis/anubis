import * as React from 'react';
import { toast } from 'sonner';

import { mockDocentes, type Docente } from '@/lib/mock-professors-management';
import {
  INITIAL_NOVO_DOCENTE_FORM,
  type NovoDocenteFormData,
  type NovoDocenteFormErrors,
} from '../types/professors-form.types';
import {
  normalizeCpf,
  validateNovoDocenteForm,
  filterProfessors,
  toggleProfessorStatus,
  mapFormToDocente,
} from '../utils/professors-form.utils';

export function useProfessors() {
  const [docentes, setDocentes] = React.useState<Docente[]>(mockDocentes);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [cadastroAberto, setCadastroAberto] = React.useState(false);
  const [novoDocenteForm, setNovoDocenteForm] =
    React.useState<NovoDocenteFormData>(INITIAL_NOVO_DOCENTE_FORM);
  const [novoDocenteFormErrors, setNovoDocenteFormErrors] = React.useState<NovoDocenteFormErrors>(
    {},
  );
  const [docenteParaReenvio, setDocenteParaReenvio] = React.useState<Docente | null>(null);
  const [docenteParaAcoes, setDocenteParaAcoes] = React.useState<Docente | null>(null);

  const docentesFiltrados = React.useMemo(
    () => filterProfessors(docentes, searchQuery),
    [docentes, searchQuery],
  );

  const paginatedDocentes = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return docentesFiltrados.slice(start, start + pageSize);
  }, [docentesFiltrados, currentPage, pageSize]);

  const totalPages = Math.ceil(docentesFiltrados.length / pageSize);

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

    const novoDocente = mapFormToDocente(novoDocenteForm);

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

    setDocentes(current => toggleProfessorStatus(current, docenteParaAcoes.id));

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return {
    docentesFiltrados: paginatedDocentes,
    totalDocentes: docentesFiltrados.length,
    searchQuery,
    currentPage,
    pageSize,
    totalPages,
    cadastroAberto,
    novoDocenteForm,
    novoDocenteFormErrors,
    docenteParaReenvio,
    docenteParaAcoes,
    setSearchQuery: handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
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
