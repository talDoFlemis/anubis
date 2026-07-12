import { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { ManagementPageLayout } from '@/components/layout/management-page-layout';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EvaluationForm } from '@/features/interviews';

import { OtherEvaluations } from '@/features/interviews';

import {
  useCandidatesByThemes,
  useCreateEvaluation,
  useCreateProjectEvaluation,
  useEvaluationsByCandidate,
  useInterviewAverage,
  useProfessorThemes,
  useProjectEvaluationsByCandidate,
} from '@/features/interviews';
import { useAuth } from '@/hooks/use-auth';
import { CONCEPT_LABELS, scoreToConcept } from '@/lib/api/interviews';

export const Route = createFileRoute('/_app/manage/interviews')({
  component: ManageInterviewsPage,
});

function ManageInterviewsPage() {
  const { data: user } = useAuth();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const { data: themesData } = useProfessorThemes(user?.id ?? '');
  const themes = themesData?.data ?? [];

  const themeIds = selectedThemeId
    ? [selectedThemeId]
    : themes.map((t: any) => t.id).filter(Boolean);

  const { data: candidatesData } = useCandidatesByThemes(themeIds);
  const enrollments = candidatesData?.enrollments ?? [];
  const candidateMap = candidatesData?.candidateMap ?? new Map();

  const selectedEnrollment = enrollments.find((e: any) => e.candidateId === selectedCandidateId);
  const isDoctoral = selectedEnrollment?.level === 'doctoral';

  const { data: evaluations } = useEvaluationsByCandidate(selectedCandidateId ?? '');
  const { data: projectEvaluations } = useProjectEvaluationsByCandidate(selectedCandidateId ?? '');
  const { data: average } = useInterviewAverage(selectedCandidateId ?? '');

  // Extrai a avaliação atual do professor logado (se existir)
  const myEvaluation = evaluations?.find((e: any) => e.evaluatorId === user?.id);
  const myProjectEvaluation = projectEvaluations?.find((e: any) => e.evaluatorId === user?.id);

  const createEval = useCreateEvaluation(selectedCandidateId ?? '');
  const createProjectEval = useCreateProjectEvaluation(selectedCandidateId ?? '');

  const handleSubmitEvaluation = (data: {
    decisionMaking: number;
    problemAnalysis: number;
    oralCommunication: number;
    researchWork: number;
    technicalKnowledge: number;
    observations?: string;
  }) => {
    if (selectedCandidateId) {
      createEval.mutate(data);
    }
  };

  const handleSubmitProjectEvaluation = (data: {
    criterion1: number;
    criterion2: number;
    criterion3: number;
    criterion4: number;
    criterion5: number;
    observations?: string;
  }) => {
    if (selectedCandidateId) {
      createProjectEval.mutate(data);
    }
  };

  const selectedCandidateProfile = selectedCandidateId
    ? candidateMap.get(selectedCandidateId)
    : null;

  const selectedCandidateName = selectedCandidateProfile
    ? `${selectedCandidateProfile.firstName ?? ''} ${selectedCandidateProfile.lastName ?? ''}`.trim()
    : '';

  return (
    <ManagementPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Avaliar Entrevistas</h1>
          <p className="text-sm text-slate-500">
            Selecione um tema de pesquisa e um candidato para realizar a avaliação.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Tema:</span>
            <div className="w-56">
              <Select
                value={selectedThemeId ?? 'all'}
                onValueChange={value => {
                  setSelectedThemeId(value === 'all' ? null : value);
                  setSelectedCandidateId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meus temas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meus temas</SelectItem>
                  {themes.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Candidato:</span>
            <div className="w-64">
              <Select
                value={selectedCandidateId ?? ''}
                onValueChange={value => setSelectedCandidateId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um candidato" />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((e: any) => {
                    const candidate = candidateMap.get(e.candidateId);
                    const name = candidate
                      ? `${candidate.firstName ?? ''} ${candidate.lastName ?? ''}`.trim()
                      : e.candidateId;
                    return (
                      <SelectItem key={e.candidateId} value={e.candidateId}>
                        {name} ({e.level === 'masters' ? 'M' : 'D'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Average score display (after submission) */}
        {average && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Média Geral da Arguição</p>
                <p className="text-xs text-emerald-600">
                  Média aritmética calculada a partir de todos os avaliadores
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-emerald-700">
                  {average.overall?.toFixed(2) ?? '-'}
                </div>
                {average.perAspectConcepts && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      average.overall >= 8
                        ? 'bg-emerald-100 text-emerald-700'
                        : average.overall >= 6
                          ? 'bg-blue-100 text-blue-700'
                          : average.overall >= 4
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {CONCEPT_LABELS[scoreToConcept(average.overall)]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Form */}
        {selectedCandidateId && (
          <EvaluationForm
            key={selectedCandidateId}
            candidateName={selectedCandidateName || selectedCandidateId}
            candidateLevel={isDoctoral ? 'doutorado' : 'mestrado'}
            isDoctoral={isDoctoral}
            initialEvaluation={myEvaluation}
            initialProjectEvaluation={myProjectEvaluation}
            onSubmitEvaluation={handleSubmitEvaluation}
            onSubmitProjectEvaluation={isDoctoral ? handleSubmitProjectEvaluation : undefined}
            isSubmitting={createEval.isPending}
            isSubmittingProject={createProjectEval.isPending}
          />
        )}

        {/* Other evaluators' evaluations */}
        {selectedCandidateId && evaluations && evaluations.length > 0 && (
          <OtherEvaluations
            evaluations={evaluations}
            currentEvaluatorId={user?.id ?? ''}
            candidateName={selectedCandidateName || selectedCandidateId}
          />
        )}

        {/* No candidate selected */}
        {!selectedCandidateId && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="text-sm text-slate-500">
              Selecione um tema e um candidato acima para começar a avaliação.
            </p>
          </div>
        )}
      </div>
    </ManagementPageLayout>
  );
}
