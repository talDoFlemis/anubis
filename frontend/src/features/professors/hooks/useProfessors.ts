import * as React from 'react';
import { toast } from 'sonner';

import { mockProfessors, type Professor } from '@/lib/mock-professors-management';
import {
  filterProfessors,
  mapFormToProfessor,
  toggleProfessorStatus,
} from '../utils/professors-form.utils';
import type { NewProfessorFormData } from '../types/professors-form.types';

export function useProfessors() {
  const [professors, setProfessors] = React.useState<Professor[]>(mockProfessors);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isCreateProfessorDialogOpen, setIsCreateProfessorDialogOpen] = React.useState(false);
  const [professorToResendInvite, setProfessorToResendInvite] = React.useState<Professor | null>(
    null,
  );
  const [professorForActions, setProfessorForActions] = React.useState<Professor | null>(null);

  const filteredProfessors = React.useMemo(
    () => filterProfessors(professors, searchQuery),
    [professors, searchQuery],
  );

  const paginatedProfessors = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProfessors.slice(start, start + pageSize);
  }, [filteredProfessors, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProfessors.length / pageSize);

  const handleOpenCreateProfessorDialog = () => {
    setIsCreateProfessorDialogOpen(true);
  };

  const handleCloseCreateProfessorDialog = () => {
    setIsCreateProfessorDialogOpen(false);
  };

  const handleCreateProfessor = (formData: NewProfessorFormData) => {
    const newProfessor = mapFormToProfessor(formData);

    setProfessors(current => [newProfessor, ...current]);
    toast.success('Cadastro de docente salvo com sucesso.');
  };

  const handleOpenResendInvite = (professor: Professor) => {
    setProfessorToResendInvite(professor);
  };

  const handleCloseResendInvite = () => {
    setProfessorToResendInvite(null);
  };

  const handleResendInvite = () => {
    toast.success(`Convite reenviado para ${professorToResendInvite?.email}.`);
    handleCloseResendInvite();
  };

  const handleOpenProfessorActions = (professor: Professor) => {
    setProfessorForActions(professor);
  };

  const handleCloseProfessorActions = () => {
    setProfessorForActions(null);
  };

  const handleToggleProfessorStatus = () => {
    if (!professorForActions) {
      return;
    }

    setProfessors(current => toggleProfessorStatus(current, professorForActions.id));

    toast.success(
      professorForActions.status === 'Desativado'
        ? `Docente ${professorForActions.nome} ativado com sucesso.`
        : `Docente ${professorForActions.nome} desativado com sucesso.`,
    );
    handleCloseProfessorActions();
  };

  const handleResetPassword = () => {
    if (!professorForActions) {
      return;
    }

    toast.success(`Solicitação de redefinição de senha enviada para ${professorForActions.email}.`);
    handleCloseProfessorActions();
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
    professors: paginatedProfessors,
    totalProfessors: filteredProfessors.length,
    searchQuery,
    currentPage,
    pageSize,
    totalPages,
    isCreateProfessorDialogOpen,
    professorToResendInvite,
    professorForActions,
    setSearchQuery: handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleOpenCreateProfessorDialog,
    handleCloseCreateProfessorDialog,
    handleCreateProfessor,
    handleOpenResendInvite,
    handleCloseResendInvite,
    handleResendInvite,
    handleOpenProfessorActions,
    handleCloseProfessorActions,
    handleToggleProfessorStatus,
    handleResetPassword,
  };
}
