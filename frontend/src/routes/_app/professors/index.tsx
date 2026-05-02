import { createFileRoute } from '@tanstack/react-router';

import { linhasPesquisaPrincipais } from '@/lib/mock-professors-management';
import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { CreateProfessorDialog } from '@/features/professors/components/CreateProfessorDialog';
import { ProfessorActionsDialog } from '@/features/professors/components/ProfessorActionsDialog';
import { ProfessorsHeader } from '@/features/professors/components/ProfessorsHeader';
import { ProfessorsTable } from '@/features/professors/components/ProfessorsTable';
import { ResendInviteDialog } from '@/features/professors/components/ResendInviteDialog';
import { useProfessors } from '@/features/professors/hooks/useProfessors';

export const Route = createFileRoute('/_app/professors/')({
  component: GestaoDocentesScreen,
});

export function GestaoDocentesScreen() {
  const {
    docentesFiltrados,
    totalDocentes,
    searchQuery,
    currentPage,
    pageSize,
    cadastroAberto,
    novoDocenteForm,
    novoDocenteFormErrors,
    docenteParaReenvio,
    docenteParaAcoes,
    setSearchQuery,
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
  } = useProfessors();

  return (
    <ManagementPageLayout>
      <div className="flex flex-col space-y-6">
        <ProfessorsHeader />

        <ProfessorsTable
          docentes={docentesFiltrados}
          totalDocentes={totalDocentes}
          onOpenCadastro={handleOpenCadastro}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenReenvio={handleOpenReenvio}
          onOpenAcoes={handleOpenAcoes}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <ResendInviteDialog
        docente={docenteParaReenvio}
        onClose={handleCloseReenvio}
        onConfirm={handleReenviarConvite}
      />

      <CreateProfessorDialog
        open={cadastroAberto}
        formData={novoDocenteForm}
        formErrors={novoDocenteFormErrors}
        linhasPesquisa={linhasPesquisaPrincipais}
        onClose={handleCloseCadastro}
        onSubmit={handleSalvarCadastro}
        onNomeCompletoChange={value => handleFieldChange('nomeCompleto', value)}
        onCpfChange={handleCpfChange}
        onMatriculaChange={value => handleFieldChange('matriculaDocente', value)}
        onEmailChange={value => handleFieldChange('email', value)}
        onInstituicaoChange={value => handleFieldChange('instituicaoOrigem', value)}
        onLinhaPesquisaChange={value => handleFieldChange('linhaPesquisaPrincipal', value)}
      />

      <ProfessorActionsDialog
        docente={docenteParaAcoes}
        onClose={handleCloseAcoes}
        onToggleStatus={handleToggleDocenteStatus}
        onResetPassword={handleRedefinirSenha}
      />
    </ManagementPageLayout>
  );
}
