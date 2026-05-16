import { MoreVertical, Search, UserPlus } from 'lucide-react';

import { Table } from '@/components/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProfessorItem } from '@/lib/api/professors';
import type { ColumnDef } from '@tanstack/react-table';

interface ProfessorsTableProps {
  professors: ProfessorItem[];
  loading: boolean;
  searchQuery: string;
  totalProfessors: number;
  currentPage: number;
  pageSize: number;
  onOpenCreateProfessorDialog: () => void;
  onSearchQueryChange: (value: string) => void;
  onOpenResendInvite: (professor: ProfessorItem) => void;
  onOpenProfessorActions: (professor: ProfessorItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function renderBadgeStatus(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 font-medium text-green-700 hover:bg-green-50"
        >
          Verificado
        </Badge>
      );
    case 'inactive':
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 font-medium text-amber-700 hover:bg-amber-50"
        >
          Pendente
        </Badge>
      );
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-100 font-medium text-slate-500 hover:bg-slate-100"
        >
          Desativado
        </Badge>
      );
  }
  return null;
}

function renderAvatarInitials(nome: string) {
  return nome.match(/[A-Z]/g)?.slice(0, 2).join('');
}

function createProfessorColumns(
  onOpenResendInvite: (professor: ProfessorItem) => void,
): ColumnDef<ProfessorItem>[] {
  return [
    {
      accessorKey: 'name',
      header: 'NOME DO DOCENTE',
      cell: ({ row }) => {
        const professor = row.original;

        return (
          <div className="flex items-center space-x-4">
            <Avatar className={`h-10 w-10 ${professor.status === 'disabled' ? 'grayscale' : ''}`}>
              <AvatarFallback className="bg-slate-100 text-sm font-semibold text-slate-600">
                {renderAvatarInitials(professor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">{professor.name}</span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {professor.department}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'E-MAIL',
      cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => {
        const professor = row.original;

        return (
          <div className="flex flex-col items-start gap-1">
            {renderBadgeStatus(professor.status)}
            {professor.status === 'inactive' && (
              <button
                onClick={() => onOpenResendInvite(professor)}
                className="mt-1 text-[10px] font-bold tracking-wider text-blue-600 uppercase transition-colors hover:text-blue-800"
              >
                REENVIAR CONVITE
              </button>
            )}
          </div>
        );
      },
    },
  ];
}

function createProfessorQuickActions(
  onOpenProfessorActions: (professor: ProfessorItem) => void,
): ColumnDef<ProfessorItem>[] {
  return [
    {
      id: 'acoes',
      header: 'AÇÕES',
      cell: ({ row }) => (
        <div className="pr-4 text-right">
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
            onClick={() => onOpenProfessorActions(row.original)}
          >
            <span className="sr-only">Abrir ações</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export function ProfessorsTable({
  professors,
  loading: isLoading,
  searchQuery,
  totalProfessors,
  currentPage,
  pageSize,
  onOpenCreateProfessorDialog,
  onSearchQueryChange,
  onOpenResendInvite,
  onOpenProfessorActions,
  onPageChange,
  onPageSizeChange,
}: ProfessorsTableProps) {
  const columns = createProfessorColumns(onOpenResendInvite);
  const quickActions = createProfessorQuickActions(onOpenProfessorActions);

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Pesquisar docente..."
            className="border-slate-200 bg-white pl-9 shadow-sm focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
          />
        </div>

        <Button
          className="rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700"
          onClick={onOpenCreateProfessorDialog}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Cadastrar Novo Docente
        </Button>
      </div>

      <Table
        loading={isLoading}
        data={professors}
        columns={columns}
        quickActions={quickActions}
        totalItems={totalProfessors}
        currentPage={currentPage}
        pageSize={pageSize}
        itemLabel="DOCENTES"
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        rowClassName={row =>
          `group ${row.original.status === 'disabled' ? 'bg-slate-50/50 opacity-60' : ''}`
        }
      />
    </>
  );
}
