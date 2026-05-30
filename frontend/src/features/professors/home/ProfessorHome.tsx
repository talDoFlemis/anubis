import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

import { getUserDisplayName } from '@/components/home/home-user';
import { HomeShell } from '@/components/home/HomeLayout';
import { HomeMetricCard } from '@/components/home/HomeMetricCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchThemeDialog } from '@/features/research-themes/components/ResearchThemeDialog';
import type { ResearchThemeFormData } from '@/features/research-themes/types/research-themes-form.types';
import type { User } from '@/lib/api';
import { api } from '@/lib/api';
import type { ResearchTheme } from '@/lib/api/research-themes';
import { formatDatePtBr, formatNumberPtBr } from '@/lib/formatters';

type ProfessorHomeProps = {
  user: User;
};

export function ProfessorHome({ user }: ProfessorHomeProps) {
  const queryClient = useQueryClient();
  const displayName = getUserDisplayName(user.firstName, user.lastName, 'Professor');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState<ResearchTheme | null>(null);

  // Queries
  const { data: themesData, isLoading } = useQuery({
    queryKey: ['my-research-themes', user.id],
    queryFn: () => api.researchThemes.findAll({ professorId: user.id }),
  });
  const themes = themesData?.data ?? [];

  const { data: professorsData } = useQuery({
    queryKey: ['professors-list'],
    queryFn: () => api.professors.findAll({ limit: 100 }),
  });
  const professors = professorsData?.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: ResearchThemeFormData) =>
      api.researchThemes.create({
        title: formData.title,
        description: formData.description,
        vacancies: formData.vacancies,
        level: formData.level,
        references: formData.references,
        associatedProfessorIds: formData.associatedProfessorIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-research-themes'] });
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
      queryClient.invalidateQueries({ queryKey: ['my-research-themes'] });
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
      queryClient.invalidateQueries({ queryKey: ['my-research-themes'] });
      toast.success('Tema de pesquisa excluído com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao excluir tema de pesquisa. Verifique se há candidatos inscritos.');
    },
  });

  // Event Handlers
  const handleRegisterNewTheme = () => {
    setSelectedTheme(null);
    setIsDialogOpen(true);
  };

  const handleEditTheme = (theme: ResearchTheme) => {
    setSelectedTheme(theme);
    setIsDialogOpen(true);
  };

  const handleDeleteTheme = (theme: ResearchTheme) => {
    if (window.confirm(`Tem certeza que deseja excluir o tema "${theme.title}"?`)) {
      deleteMutation.mutate(theme.id);
    }
  };

  const handleSeeCandidatesTheme = (_theme: ResearchTheme) => {
    toast.info('Visualização de candidatos ainda não implementada para o ciclo de seleção atual.');
  };

  const handleDialogSubmit = (formData: ResearchThemeFormData) => {
    if (selectedTheme) {
      updateMutation.mutate({ id: selectedTheme.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Metrics calculation
  const publishedThemes = themes.length;
  const offeredSlots = themes.reduce((acc, t) => acc + t.vacancies, 0);
  const enrolledCandidates = 0; // Not implemented yet (backend returns false/empty mock)

  return (
    <HomeShell>
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden rounded-4xl">
          <CardContent className="space-y-6 p-7 sm:p-9">
            <div className="space-y-4">
              <p className="font-label text-primary">Portal do docente</p>
              <div className="space-y-3">
                <h1 className="text-foreground font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                  Olá, Prof. {displayName}
                </h1>
                <p className="text-muted-foreground max-w-3xl text-base leading-8">
                  Este painel resume os temas ativos, as vagas abertas e os candidatos inscritos no
                  ciclo atual do programa.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <HomeMetricCard label="Temas publicados" value={formatNumberPtBr(publishedThemes)} />
              <HomeMetricCard label="Vagas ofertadas" value={formatNumberPtBr(offeredSlots)} />
              <HomeMetricCard
                label="Candidatos inscritos"
                value={formatNumberPtBr(enrolledCandidates)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-4xl">
          <CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-3">
              <p className="font-label text-primary">Meus temas de pesquisa</p>
              <CardTitle>Gestão de temas e candidatos</CardTitle>
            </div>
            <Button onClick={handleRegisterNewTheme}>Cadastrar novo tema</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">Carregando temas...</div>
            ) : themes.length > 0 ? (
              themes.map(theme => {
                const isOwner = theme.professorId === user.id;
                return (
                  <div key={theme.id} className="anubis-surface-muted rounded-3xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <p className="text-foreground font-serif text-xl">{theme.title}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={theme.level === 'masters' ? 'default' : 'secondary'}>
                              {theme.level === 'masters' ? 'Mestrado' : 'Doutorado'}
                            </Badge>
                            {!isOwner && (
                              <Badge
                                variant="outline"
                                className="border-blue-200 text-blue-700 bg-blue-50/50"
                              >
                                Coorientador / Colaborador
                              </Badge>
                            )}
                            {theme.associatedProfessors &&
                              theme.associatedProfessors.length > 0 && (
                                <span className="text-xs text-slate-400 self-center">
                                  Colaboradores:{' '}
                                  {theme.associatedProfessors
                                    .map(p => `${p.firstName} ${p.lastName}`)
                                    .join(', ')}
                                </span>
                              )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-4xl">
                          {theme.description}
                        </p>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                          <span>Atualizado em {formatDatePtBr(theme.updatedAt)}</span>
                          <span>Vagas: {formatNumberPtBr(theme.vacancies)}</span>
                          <span>Candidatos: {formatNumberPtBr(0)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant="secondary" onClick={() => handleEditTheme(theme)}>
                          Editar
                        </Button>
                        <Button variant="secondary" onClick={() => handleSeeCandidatesTheme(theme)}>
                          Ver candidatos
                        </Button>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteTheme(theme)}
                          >
                            Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                Você não possui nenhum tema de pesquisa publicado ou associado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ResearchThemeDialog
        open={isDialogOpen}
        theme={selectedTheme}
        professors={professors}
        isSecretaryOrCoordinator={false}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
      />
    </HomeShell>
  );
}
