import { createFileRoute } from '@tanstack/react-router';

import { linhasPesquisaPrincipais } from '@/lib/mock-professors-management';
import { ManagementPageLayout } from '../shared/management-page-layout';
import { CreateProfessorDialog } from './components/CreateProfessorDialog';
import { ProfessorActionsDialog } from './components/ProfessorActionsDialog';
import { ProfessorsHeader } from './components/ProfessorsHeader';
import { ProfessorsTable } from './components/ProfessorsTable';
import { ResendInviteDialog } from './components/ResendInviteDialog';
import { useProfessors } from './hooks/useProfessors';

export const Route = createFileRoute('/_app/professors/')({
  component: GestaoDocentesScreen,
});

export function GestaoDocentesScreen() {
  const {
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
  } = useProfessors();

  return (
    <ManagementPageLayout activeTab="professors">
      <ProfessorsHeader onOpenCadastro={handleOpenCadastro} />

      <ProfessorsTable
        docentes={docentesFiltrados}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onOpenReenvio={handleOpenReenvio}
        onOpenAcoes={handleOpenAcoes}
      />

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
