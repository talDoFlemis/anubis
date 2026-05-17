import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import type { ProfessorItem } from '@/lib/api/professors';
import type { NewProfessorFormData } from '../types/professors-form.types';

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

export function useProfessors() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isCreateProfessorDialogOpen, setIsCreateProfessorDialogOpen] = React.useState(false);
  const [professorToResendInvite, setProfessorToResendInvite] =
    React.useState<ProfessorItem | null>(null);
  const [professorForActions, setProfessorForActions] = React.useState<ProfessorItem | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const {
    data: paginatedData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['professors', currentPage, pageSize, debouncedSearch],
    queryFn: () =>
      api.professors.findAll({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
      }),
  });

  const professors = paginatedData?.data ?? [];
  const totalProfessors = paginatedData?.pagination.total ?? 0;
  const totalPages = paginatedData?.pagination.totalPages ?? 1;

  const handleOpenCreateProfessorDialog = () => {
    setIsCreateProfessorDialogOpen(true);
  };

  const handleCloseCreateProfessorDialog = () => {
    setIsCreateProfessorDialogOpen(false);
  };

  const createProfessorMutation = useMutation({
    mutationFn: (formData: NewProfessorFormData) => {
      const [firstName, ...rest] = formData.fullName.trim().split(' ');
      const lastName = rest.length > 0 ? rest.join(' ') : null;

      return api.professors.invite({
        email: formData.email.trim().toLowerCase(),
        cpf: normalizeCpf(formData.cpf) || null,
        firstName,
        lastName,
        department: formData.mainResearchLine,
        institution: formData.originInstitution.trim(),
        status: 'inactive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      toast.success('Cadastro de docente salvo com sucesso.');
      handleCloseCreateProfessorDialog();
    },
    onError: () => {
      toast.error('Erro ao cadastrar docente.');
    },
  });

  const handleCreateProfessor = (formData: NewProfessorFormData) => {
    createProfessorMutation.mutate(formData);
  };

  const handleOpenResendInvite = (professor: ProfessorItem) => {
    setProfessorToResendInvite(professor);
  };

  const handleCloseResendInvite = () => {
    setProfessorToResendInvite(null);
  };

  const resendInviteMutation = useMutation({
    mutationFn: (email: string) => api.auth.resendProfessorOnboarding({ email }),
    onSuccess: (_, email) => {
      toast.success(`Convite reenviado para ${email}.`);
      handleCloseResendInvite();
    },
    onError: () => {
      toast.error('Erro ao reenviar convite.');
    },
  });

  const handleResendInvite = () => {
    if (professorToResendInvite) {
      resendInviteMutation.mutate(professorToResendInvite.email);
    }
  };

  const handleOpenProfessorActions = (professor: ProfessorItem) => {
    setProfessorForActions(professor);
  };

  const handleCloseProfessorActions = () => {
    setProfessorForActions(null);
  };

  const toggleStatusMutation = useMutation({
    mutationFn: (professor: ProfessorItem) => {
      if (professor.status === 'disabled') {
        return api.professors.enable(professor.id);
      } else {
        return api.professors.disable(professor.id);
      }
    },
    onSuccess: (_, professor) => {
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      toast.success(
        professor.status === 'disabled'
          ? `Docente ${professor.name} ativado com sucesso.`
          : `Docente ${professor.name} desativado com sucesso.`,
      );
      handleCloseProfessorActions();
    },
    onError: () => {
      toast.error('Erro ao alterar status do docente.');
    },
  });

  const handleToggleProfessorStatus = () => {
    if (!professorForActions) return;
    toggleStatusMutation.mutate(professorForActions);
  };

  const handleResetPassword = () => {
    if (!professorForActions) return;
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
    professors,
    loading: isLoading || isFetching,
    totalProfessors,
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
    isResendingInvite: resendInviteMutation.isPending,
    handleOpenProfessorActions,
    handleCloseProfessorActions,
    handleToggleProfessorStatus,
    handleResetPassword,
  };
}
