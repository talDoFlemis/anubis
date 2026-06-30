import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { classification } from '@/lib/api';

export const useClassificationRanking = (params?: {
  researchThemeId?: string | null;
  stage?: 'mestrado' | 'doutorado' | null;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['classification', 'ranking', params],
    queryFn: () => classification.getRanking(params),
  });
};

export const useTriggerClassification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: {
      researchThemeId?: string | null;
      stage?: 'mestrado' | 'doutorado' | null;
    }) => classification.triggerClassification(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification', 'ranking'] });
      toast.success('Classificação executada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao executar classificação: ${error.message}`);
    },
  });
};
