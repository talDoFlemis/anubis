import { createFileRoute } from '@tanstack/react-router';

import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { CreateProfessorDialog } from '@/features/professors/components/CreateProfessorDialog';
import { ProfessorActionsDialog } from '@/features/professors/components/ProfessorActionsDialog';
import { ProfessorsHeader } from '@/features/professors/components/ProfessorsHeader';
import { ProfessorsTable } from '@/features/professors/components/ProfessorsTable';
import { ResendInviteDialog } from '@/features/professors/components/ResendInviteDialog';
import { useProfessors } from '@/features/professors/hooks/useProfessors';
import { mainResearchLines } from '@/lib/mock-professors-management';

export const Route = createFileRoute('/_app/professors/')({
  component: GestaoDocentesScreen,
});

export function GestaoDocentesScreen() {
  const {
    professors,
    loading,
    totalProfessors,
    searchQuery,
    currentPage,
    pageSize,
    isCreateProfessorDialogOpen,
    professorToResendInvite,
    professorForActions,
    setSearchQuery,
    handlePageChange,
    handlePageSizeChange,
    handleOpenCreateProfessorDialog,
    handleCloseCreateProfessorDialog,
    handleCreateProfessor,
    handleOpenResendInvite,
    handleCloseResendInvite,
    handleResendInvite,
    isResendingInvite,
    handleOpenProfessorActions,
    handleCloseProfessorActions,
    handleToggleProfessorStatus,
    handleResetPassword,
  } = useProfessors();

  return (
    <ManagementPageLayout>
      <div className="flex flex-col space-y-6">
        <ProfessorsHeader />

        <ProfessorsTable
          loading={loading}
          professors={professors}
          totalProfessors={totalProfessors}
          onOpenCreateProfessorDialog={handleOpenCreateProfessorDialog}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenResendInvite={handleOpenResendInvite}
          onOpenProfessorActions={handleOpenProfessorActions}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <ResendInviteDialog
        professor={professorToResendInvite}
        onClose={handleCloseResendInvite}
        onConfirm={handleResendInvite}
        isLoading={isResendingInvite}
      />

      <CreateProfessorDialog
        open={isCreateProfessorDialogOpen}
        linhasPesquisa={mainResearchLines}
        onClose={handleCloseCreateProfessorDialog}
        onSubmit={handleCreateProfessor}
      />

      <ProfessorActionsDialog
        professor={professorForActions}
        onClose={handleCloseProfessorActions}
        onToggleStatus={handleToggleProfessorStatus}
        onResetPassword={handleResetPassword}
      />
    </ManagementPageLayout>
  );
}
