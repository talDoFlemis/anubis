import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import { Table } from '@/components/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useClassificationRanking,
  useTriggerClassification,
} from '@/features/classification/hooks/use-classification';

import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { Classification } from '@/lib/api/classification';

import type { CandidateProfile } from '@/lib/api/candidates';
import type { ResearchTheme } from '@/lib/api/research-themes';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const formatScore = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  return isNaN(num) ? '-' : num.toFixed(2);
};

function createColumns(
  candidateMap: Map<string, string>,
  themeMap: Map<string, string>,
  activeStage: 'mestrado' | 'doutorado',
): ColumnDef<Classification>[] {
  const columns: ColumnDef<Classification>[] = [
    {
      accessorKey: 'candidateId',
      header: 'CANDIDATO',
      cell: ({ row }) => {
        const id = row.original.candidateId;
        return (
          <span className="text-sm font-medium text-slate-900">{candidateMap.get(id) ?? id}</span>
        );
      },
    },
    {
      accessorKey: 'researchThemeId',
      header: 'TEMA DE PESQUISA',
      cell: ({ row }) => {
        const id = row.original.researchThemeId;
        return <span className="text-sm text-slate-700">{themeMap.get(id) ?? id}</span>;
      },
    },
    {
      accessorKey: 'ira',
      header: 'IRA',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{formatScore(row.original.ira)}</span>
      ),
    },
    {
      accessorKey: 'cvScore',
      header: 'PONTUAÇÃO CV',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{formatScore(row.original.cvScore)}</span>
      ),
    },
    {
      accessorKey: 'interviewScore',
      header: 'NOTA ENTREVISTA',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{formatScore(row.original.interviewScore)}</span>
      ),
    },
  ];

  if (activeStage === 'doutorado') {
    columns.push({
      accessorKey: 'projectScore',
      header: 'PROJETO',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{formatScore(row.original.projectScore)}</span>
      ),
    });
  }

  columns.push(
    {
      accessorKey: 'finalScore',
      header: 'NOTA FINAL',
      cell: ({ row }) => (
        <span className="text-sm font-bold text-indigo-600">
          {formatScore(row.original.finalScore)}
        </span>
      ),
    },
    {
      accessorKey: 'rank',
      header: 'CLASSIFICAÇÃO',
      cell: ({ row }) => (
        <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold leading-none text-emerald-800">
          {row.original.rank}º lugar
        </span>
      ),
    },
  );

  return columns;
}

export function ClassificationRankingTable() {
  const { data: user } = useAuth();
  const [activeStage, setActiveStage] = useState<'mestrado' | 'doutorado'>('mestrado');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);

  const isSecretaryOrCoordinator =
    user?.role === 'mdcc-secretary' ||
    user?.role === 'post-graduate-coordinator' ||
    user?.role === 'post-graduate-vice-coordinator';

  const { data: candidatesData } = useQuery({
    queryKey: ['candidates', 'all-classification'],
    queryFn: () => api.candidates.findAll({ page: 1, limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: themesData } = useQuery({
    queryKey: ['research-themes', 'all-classification'],
    queryFn: () => api.researchThemes.findAll({ page: 1, limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const candidateMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = Array.isArray(candidatesData?.data) ? candidatesData.data : [];
    list.forEach((c: CandidateProfile) => {
      const firstName = c.firstName ?? '';
      const lastName = c.lastName ?? '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (c.userId && fullName) map.set(c.userId, fullName);
    });
    return map;
  }, [candidatesData]);

  const themeMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = Array.isArray(themesData?.data) ? themesData.data : [];
    list.forEach((t: ResearchTheme) => {
      if (t.id && t.title) map.set(t.id, t.title);
    });
    return map;
  }, [themesData]);

  const {
    data: classificationData,
    isLoading,
    isError,
  } = useClassificationRanking({
    stage: activeStage,
    researchThemeId: selectedThemeId === 'all' ? undefined : selectedThemeId,
    page: currentPage,
    limit: itemsPerPage,
  });

  const { mutate: triggerClassification, isPending: isTriggering } = useTriggerClassification();

  const columns = useMemo(
    () => createColumns(candidateMap, themeMap, activeStage),
    [candidateMap, themeMap, activeStage],
  );

  const data = classificationData?.data ?? [];
  const total = classificationData?.meta?.total ?? 0;

  if (isError) {
    return <div className="py-8 text-center text-red-500">Erro ao carregar a classificação.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Classificação Final</h1>
          <p className="text-sm text-slate-500">
            Lista de candidatos classificados por tema de pesquisa e etapa.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Tema de pesquisa:</span>
            <div className="w-48">
              <Select
                value={selectedThemeId}
                onValueChange={(value: string) => {
                  setSelectedThemeId(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os temas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os temas</SelectItem>
                  {themesData?.data?.map((t: ResearchTheme) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isSecretaryOrCoordinator && (
            <Button
              onClick={() => {
                triggerClassification({
                  stage: activeStage,
                  researchThemeId: selectedThemeId === 'all' ? undefined : selectedThemeId,
                });
              }}
              disabled={isTriggering}
            >
              {isTriggering ? 'Processando...' : 'Iniciar Classificação'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <Button
          variant={activeStage === 'mestrado' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveStage('mestrado');
            setCurrentPage(1);
          }}
          className="font-medium"
        >
          Mestrado
        </Button>
        <Button
          variant={activeStage === 'doutorado' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveStage('doutorado');
            setCurrentPage(1);
          }}
          className="font-medium"
        >
          Doutorado
        </Button>
      </div>

      {/* Table */}
      <Table<Classification>
        loading={isLoading}
        data={data}
        columns={columns}
        totalItems={total}
        currentPage={currentPage}
        pageSize={itemsPerPage}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        itemLabel="CLASSIFICAÇÕES"
        onPageChange={setCurrentPage}
        onPageSizeChange={(size: number) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        emptyState={
          <div className="space-y-1">
            <p className="font-medium text-slate-700">Nenhuma classificação calculada</p>
            <p className="text-xs text-slate-400">
              Clique em "Iniciar Classificação" para processar os candidatos desta etapa.
            </p>
          </div>
        }
      />
    </div>
  );
}
