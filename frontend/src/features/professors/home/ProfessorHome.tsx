import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
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

  // Active theme candidate view state
  const [activeCandidatesTheme, setActiveCandidatesTheme] = React.useState<ResearchTheme | null>(
    null,
  );

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

  const { data: validationCandidatesData, isLoading: isLoadingValidationCandidates } = useQuery({
    queryKey: ['validation', 'candidates', { limit: 200 }],
    queryFn: () => api.validation.findCandidates({ limit: 200 }),
  });
  const allValidationCandidates = validationCandidatesData?.data ?? [];

  const themeCandidates = React.useMemo(() => {
    if (!activeCandidatesTheme) return [];
    return allValidationCandidates.filter(
      c =>
        c.primaryThemeId === activeCandidatesTheme.id ||
        c.secondaryThemeId === activeCandidatesTheme.id,
    );
  }, [allValidationCandidates, activeCandidatesTheme]);

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

  const handleSeeCandidatesTheme = (theme: ResearchTheme) => {
    setActiveCandidatesTheme(theme);
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

  // Calculate total enrolled candidates for the professor's themes
  const enrolledCandidates = allValidationCandidates.length;

  const getCandidatesCountForTheme = (themeId: string) => {
    return allValidationCandidates.filter(
      c => c.primaryThemeId === themeId || c.secondaryThemeId === themeId,
    ).length;
  };

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

        {activeCandidatesTheme ? (
          /* Enrolled candidates for the selected theme */
          <Card className="overflow-hidden rounded-4xl">
            <CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCandidatesTheme(null)}
                    className="rounded-full text-slate-500 hover:text-slate-900 border border-slate-100 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Temas
                  </Button>
                  <p className="font-label text-primary">Candidatos Inscritos</p>
                </div>
                <CardTitle>Tema: {activeCandidatesTheme.title}</CardTitle>
              </div>
              <Badge variant={activeCandidatesTheme.level === 'masters' ? 'default' : 'secondary'}>
                {activeCandidatesTheme.level === 'masters' ? 'Mestrado' : 'Doutorado'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingValidationCandidates ? (
                <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Carregando candidatos...
                </div>
              ) : themeCandidates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-500">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
                      <tr>
                        <th className="px-6 py-4">Candidato</th>
                        <th className="px-6 py-4">Opção</th>
                        <th className="px-6 py-4">IRA</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Pontuação (Decl. / Homol.)</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-t border-slate-100 bg-white">
                      {themeCandidates.map(candidate => {
                        const isPrimary = candidate.primaryThemeId === activeCandidatesTheme.id;
                        let statusText = 'Pendente';
                        let statusClass = 'border-slate-200 text-slate-700 bg-slate-50/50';
                        if (candidate.status === 'completed') {
                          statusText = 'Homologado';
                          statusClass = 'border-green-200 text-green-700 bg-green-50/50';
                        } else if (candidate.status === 'in_progress') {
                          statusText = 'Em Progresso';
                          statusClass = 'border-amber-200 text-amber-700 bg-amber-50/50';
                        }

                        return (
                          <tr
                            key={candidate.enrollmentId}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900">
                                {candidate.candidateName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {candidate.candidateEmail}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={
                                  isPrimary
                                    ? 'border-blue-200 text-blue-700 bg-blue-50/50'
                                    : 'border-slate-200 text-slate-700 bg-slate-50/50'
                                }
                              >
                                {isPrimary ? 'Opção Primária' : 'Opção Secundária'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-mono font-medium text-slate-700">
                              {candidate.ira != null ? candidate.ira.toFixed(2) : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={statusClass}>
                                {statusText}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-sm">
                              <span className="font-semibold text-slate-700">
                                {candidate.declaredScore.toFixed(1)}
                              </span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="font-semibold text-primary">
                                {candidate.validatedScore !== null
                                  ? candidate.validatedScore.toFixed(1)
                                  : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button size="sm" asChild className="rounded-xl">
                                <Link
                                  to="/manage/enrollments/$id"
                                  params={{ id: candidate.enrollmentId }}
                                >
                                  Avaliar Currículo
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">
                  Nenhum candidato submeteu inscrição para este tema ainda.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Research Themes List */
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
                  const themeCandCount = getCandidatesCountForTheme(theme.id);

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
                            <span className="font-semibold text-slate-600">
                              Candidatos: {formatNumberPtBr(themeCandCount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="secondary" onClick={() => handleEditTheme(theme)}>
                            Editar
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleSeeCandidatesTheme(theme)}
                          >
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
        )}
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
