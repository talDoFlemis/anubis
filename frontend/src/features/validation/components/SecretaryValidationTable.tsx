import { Link } from '@tanstack/react-router';

import { ChevronRight } from 'lucide-react';

import type { ColumnDef } from '@tanstack/react-table';

import { Table } from '@/components/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { type CandidateValidationSummary } from '@/lib/api/validation';

interface SecretaryValidationTableProps {
  data: CandidateValidationSummary[];
  loading: boolean;
  onPageChange: (page: number) => void;
  currentPage: number;
}

export function SecretaryValidationTable({
  data,
  loading,
  onPageChange,
  currentPage,
}: SecretaryValidationTableProps) {
  const columns: ColumnDef<CandidateValidationSummary>[] = [
    {
      accessorKey: 'candidateName',
      header: 'CANDIDATO',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.candidateName}</p>
          <p className="text-xs text-slate-500">{row.original.candidateEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'level',
      header: 'NÍVEL',
    },
    {
      accessorKey: 'themeName',
      header: 'TEMA',
    },
    {
      accessorKey: 'professorName',
      header: 'PROFESSOR',
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const quickActions: ColumnDef<CandidateValidationSummary>[] = [
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="sm">
          <Link to="/validation/$enrollmentId" params={{ enrollmentId: row.original.enrollmentId }}>
            Avaliar <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <Table
      loading={loading}
      data={data}
      columns={columns}
      quickActions={quickActions}
      totalItems={data.length}
      currentPage={currentPage}
      pageSize={10}
      itemLabel="CANDIDATOS"
      onPageChange={onPageChange}
      onPageSizeChange={() => {}}
    />
  );
}
