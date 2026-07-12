import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';

export function useProfessorThemes(professorId: string) {
  return useQuery({
    queryKey: ['my-research-themes', professorId],
    queryFn: () => api.researchThemes.findAll({ professorId }),
  });
}

export function useCandidatesByThemes(themeIds: string[]) {
  return useQuery({
    queryKey: ['candidates-by-themes', themeIds],
    queryFn: async () => {
      const enrollments = await api.enrollments.findAll({ limit: 100 });
      const themeSet = new Set(themeIds);

      const filtered = (enrollments.data ?? []).filter(e => {
        if (e.status !== 'submitted') return false;
        return themeSet.has(e.primaryThemeId ?? '') || themeSet.has(e.secondaryThemeId ?? '');
      });

      const allCandidates = await api.candidates.findAll({ limit: 100 });
      const candidateMap = new Map((allCandidates.data ?? []).map(c => [c.userId, c]));

      return { enrollments: filtered, candidateMap };
    },
    enabled: themeIds.length > 0,
    staleTime: 10 * 1000, // 10 seconds - refetch frequently to see new evaluations
    refetchOnMount: true,
  });
}

export function useEvaluationsByCandidate(candidateId: string) {
  return useQuery({
    queryKey: ['interview-evaluations', candidateId],
    queryFn: () => api.interviews.getEvaluationsByCandidate(candidateId),
    enabled: !!candidateId,
    refetchOnMount: true,
  });
}

export function useInterviewAverage(candidateId: string) {
  return useQuery({
    queryKey: ['interview-average', candidateId],
    queryFn: () => api.interviews.getInterviewAverage(candidateId),
    enabled: !!candidateId,
    refetchOnMount: true,
  });
}

export function useProjectAverage(candidateId: string) {
  return useQuery({
    queryKey: ['project-average', candidateId],
    queryFn: () => api.interviews.getProjectAverage(candidateId),
    enabled: !!candidateId,
    refetchOnMount: true,
  });
}

export function useProjectEvaluationsByCandidate(candidateId: string) {
  return useQuery({
    queryKey: ['project-evaluations', candidateId],
    queryFn: () => api.interviews.getProjectEvaluationsByCandidate(candidateId),
    enabled: !!candidateId,
    refetchOnMount: true,
  });
}

export function useCreateEvaluation(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      decisionMaking: number;
      problemAnalysis: number;
      oralCommunication: number;
      researchWork: number;
      technicalKnowledge: number;
      observations?: string;
    }) => api.interviews.createEvaluation(candidateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-evaluations', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['interview-average', candidateId] });
      toast.success('Avaliação salva com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar avaliação: ${error.message}`);
    },
  });
}

export function useCreateProjectEvaluation(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      criterion1: number;
      criterion2: number;
      criterion3: number;
      criterion4: number;
      criterion5: number;
      observations?: string;
    }) => api.interviews.createProjectEvaluation(candidateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-evaluations', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['project-average', candidateId] });
      toast.success('Avaliação de projeto salva com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar avaliação de projeto: ${error.message}`);
    },
  });
}
