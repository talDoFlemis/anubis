import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { toast } from 'sonner';

import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResearchThemeDialog } from '@/features/research-themes/components/ResearchThemeDialog';
import type { ResearchThemeFormData } from '@/features/research-themes/types/research-themes-form.types';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import type { ResearchTheme } from '@/lib/api/research-themes';
import { formatDatePtBr, formatNumberPtBr } from '@/lib/formatters';

export const Route = createFileRoute('/_app/manage/research-themes')({
  component: GestaoTemasScreen,
});

export function GestaoTemasScreen() {
  const queryClient = useQueryClient();

  // Search and filter state
  const [search, setSearch] = React.useState('');
  const [level, setLevel] = React.useState<'all' | 'masters' | 'doctoral'>('all');
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const debouncedSearch = useDebounce(search, 300);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState<ResearchTheme | null>(null);

  // Query Themes
  const { data: themesData, isLoading } = useQuery({
    queryKey: ['manage-research-themes', page, pageSize, debouncedSearch, level],
    queryFn: () =>
      api.researchThemes.findAll({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        level: level === 'all' ? undefined : level,
      }),
  });
  const themes = themesData?.data ?? [];
  const total = themesData?.pagination.total ?? 0;
  const totalPages = themesData?.pagination.totalPages ?? 1;

  // Query Professors (for assigning owners & collaborators)
  const { data: professorsData } = useQuery({
    queryKey: ['professors-list-all'],
    queryFn: () => api.professors.findAll({ limit: 100 }),
  });
  const professors = professorsData?.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: ResearchThemeFormData) => {
      if (!formData.professorId) {
        throw new Error('Professor proprietário é obrigatório.');
      }
      return api.researchThemes.createOnBehalf({
        professorId: formData.professorId,
        title: formData.title,
        description: formData.description,
        vacancies: formData.vacancies,
        level: formData.level,
        references: formData.references,
        associatedProfessorIds: formData.associatedProfessorIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-research-themes'] });
      toast.success('Tema de pesquisa cadastrado com sucesso.');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Erro ao cadastrar tema de pesquisa.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: ResearchThemeFormData }) =>
      api.researchThemes.update(data.id, {
        title: data.payload.title,
        description: data.payload.description,
        vacancies: data.payload.vacancies,
        level: data.payload.level,
        references: data.payload.references,
        associatedProfessorIds: data.payload.associatedProfessorIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-research-themes'] });
      toast.success('Tema de pesquisa atualizado com sucesso.');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar tema de pesquisa.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.researchThemes.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-research-themes'] });
      toast.success('Tema de pesquisa excluído com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao excluir tema de pesquisa. Verifique se há candidatos inscritos.');
    },
  });

  // Handlers
  const handleCreateNew = () => {
    setSelectedTheme(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (theme: ResearchTheme) => {
    setSelectedTheme(theme);
    setIsDialogOpen(true);
  };

  const handleDelete = (theme: ResearchTheme) => {
    if (window.confirm(`Tem certeza que deseja excluir o tema "${theme.title}"?`)) {
      deleteMutation.mutate(theme.id);
    }
  };

  const handleDialogSubmit = (formData: ResearchThemeFormData) => {
    if (selectedTheme) {
      updateMutation.mutate({ id: selectedTheme.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <ManagementPageLayout>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Gestão de Temas de Pesquisa
            </h1>
            <p className="text-sm text-slate-500">
              Cadastre, edite e gerencie os temas de pesquisa ofertados no programa de
              pós-graduação.
            </p>
          </div>
          <Button onClick={handleCreateNew} className="self-start sm:self-center">
            Cadastrar novo tema
          </Button>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border-slate-200">
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Buscar temas por título, descrição ou nome do orientador/colaborador..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <Select
                  value={level}
                  onValueChange={val => {
                    setLevel(val as 'all' | 'masters' | 'doctoral');
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Níveis</SelectItem>
                    <SelectItem value="masters">Mestrado</SelectItem>
                    <SelectItem value="doctoral">Doutorado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List of themes */}
        <Card className="overflow-hidden rounded-3xl border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Temas de Pesquisa Ativos ({total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-slate-500">Carregando temas...</div>
            ) : themes.length > 0 ? (
              themes.map(theme => (
                <div key={theme.id} className="p-6 transition-colors hover:bg-slate-50/50">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="space-y-2.5 max-w-4xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-serif text-lg font-medium text-slate-900">
                          {theme.title}
                        </p>
                        <Badge variant={theme.level === 'masters' ? 'default' : 'secondary'}>
                          {theme.level === 'masters' ? 'Mestrado' : 'Doutorado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3">{theme.description}</p>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                        <span>
                          Orientador:{' '}
                          <strong className="text-slate-800">
                            {theme.professor
                              ? `${theme.professor.firstName} ${theme.professor.lastName}`
                              : 'Desconhecido'}
                          </strong>
                        </span>
                        <span>
                          Vagas:{' '}
                          <strong className="text-slate-800">
                            {formatNumberPtBr(theme.vacancies)}
                          </strong>
                        </span>
                        <span>
                          Atualizado em: <strong>{formatDatePtBr(theme.updatedAt)}</strong>
                        </span>
                      </div>

                      {theme.associatedProfessors && theme.associatedProfessors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs text-slate-400">Colaboradores:</span>
                          {theme.associatedProfessors.map(p => (
                            <Badge
                              key={p.id}
                              variant="outline"
                              className="text-[10px] py-0 px-2 font-normal"
                            >
                              {p.firstName} {p.lastName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(theme)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(theme)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">
                Nenhum tema de pesquisa encontrado para os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <div className="text-xs text-slate-500">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      <ResearchThemeDialog
        open={isDialogOpen}
        theme={selectedTheme}
        professors={professors}
        isSecretaryOrCoordinator={true}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
      />
    </ManagementPageLayout>
  );
}
