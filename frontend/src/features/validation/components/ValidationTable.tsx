import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, ChevronRight, Clock, FileCheck2, Search } from 'lucide-react';

import { Table } from '@/components/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  CandidateValidationSummary,
  ValidationStatus,
} from '@/features/validation/hooks/use-validation';

interface ValidationTableProps {
  candidates: CandidateValidationSummary[];
  loading: boolean;
  searchQuery: string;
  totalCandidates: number;
  currentPage: number;
  pageSize: number;
  onSearchQueryChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function renderBadgeStatus(status: ValidationStatus) {
  switch (status) {
    case 'completed':
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 font-medium text-green-800"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Concluído
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 font-medium text-amber-800"
        >
          <Clock className="mr-1 h-3 w-3" /> Em Revisão
        </Badge>
      );
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-100 font-medium text-slate-700"
        >
          <FileCheck2 className="mr-1 h-3 w-3" /> Pendente
        </Badge>
      );
  }
}

function createCandidateColumns(): ColumnDef<CandidateValidationSummary>[] {
  return [
    {
      accessorKey: 'candidateName',
      header: 'CANDIDATO',
      cell: ({ row }) => {
        const candidate = row.original;
        return (
          <div className="space-y-1">
            <p className="text-foreground font-medium">{candidate.candidateName}</p>
            <p className="text-muted-foreground text-xs">{candidate.candidateEmail}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'themeName',
      header: 'TEMA DE PESQUISA',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'declaredScore',
      header: () => <div className="text-right">NOTA DECLARADA</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-medium text-slate-600">{getValue<number>().toFixed(1)}</div>
      ),
    },
    {
      accessorKey: 'validatedScore',
      header: () => <div className="text-right">NOTA VALIDADA</div>,
      cell: ({ getValue }) => {
        const score = getValue<number | null>();
        return (
          <div className="text-primary text-right font-semibold">
            {score !== null ? score.toFixed(1) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">STATUS</div>,
      cell: ({ getValue }) => (
        <div className="flex justify-center">{renderBadgeStatus(getValue<ValidationStatus>())}</div>
      ),
    },
  ];
}

function createCandidateQuickActions(): ColumnDef<CandidateValidationSummary>[] {
  return [
    {
      id: 'acoes',
      header: () => <div className="text-right">AÇÕES</div>,
      cell: ({ row }) => (
        <div className="pr-4 text-right">
          <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10">
            <Link
              to="/validation/$enrollmentId"
              params={{ enrollmentId: row.original.enrollmentId }}
            >
              Avaliar <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];
}

export function ValidationTable({
  candidates,
  loading: isLoading,
  searchQuery,
  totalCandidates,
  currentPage,
  pageSize,
  onSearchQueryChange,
  onPageChange,
  onPageSizeChange,
}: ValidationTableProps) {
  const columns = createCandidateColumns();
  const quickActions = createCandidateQuickActions();

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar candidato por nome..."
            className="bg-white pl-9 shadow-sm"
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
          />
        </div>
      </div>

      <Table
        loading={isLoading}
        data={candidates}
        columns={columns}
        quickActions={quickActions}
        totalItems={totalCandidates}
        currentPage={currentPage}
        pageSize={pageSize}
        itemLabel="CANDIDATOS"
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
