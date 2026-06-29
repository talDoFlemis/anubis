import { useMemo } from 'react';

import { Button } from '@/components/ui/button';

import {
  useClassificationRanking,
  useTriggerClassification,
} from '@/features/classification/hooks/use-classification';

import { useAuth } from '@/hooks/use-auth';

export function ClassificationRankingTable() {
  const { data: user } = useAuth();
  const isSecretaryOrCoordinator =
    user?.role === 'mdccSecretary' ||
    user?.role === 'postGraduateCoordinator' ||
    user?.role === 'postGraduateViceCoordinator';

  const {
    data: classificationData,
    isLoading,
    isError,
  } = useClassificationRanking({
    page: 1,
    limit: 1000,
  });

  const { mutate: triggerClassification, isPending: isTriggering } = useTriggerClassification();

  const rows = useMemo(() => {
    if (!classificationData?.data) return [];

    return classificationData.data.map((item: any) => ({
      candidateId: item.candidateId,
      researchThemeId: item.researchThemeId,
      ira: 0,
      cvScore: item.cvScore,
      interviewScore: item.interviewScore,
      projectScore: item.projectScore,
      finalScore: item.finalScore,
      rank: item.rank,
    }));
  }, [classificationData]);

  if (isLoading) {
    return <div className="text-center py-8">Carregando classificação...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Erro ao carregar a classificação.</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Classificação Final</h1>
          <p className="text-sm text-slate-500">
            Lista de candidatos classificados por tema de pesquisa e etapa.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isSecretaryOrCoordinator && (
            <Button
              onClick={() => {
                if (
                  window.confirm(
                    'Tem certeza que deseja executar a classificação? Isso irá recalcular as classificações para todos os candidatos inscritos.',
                  )
                ) {
                  triggerClassification({
                    //
                  });
                }
              }}
              disabled={isTriggering}
            >
              {isTriggering ? 'Processando...' : 'Iniciar Classificação'}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border-slate-200">
        <table className="w-full text-sm text-left rtl:text-right border-collapse">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Candidato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Tema
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                IRA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Pontuação CV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Nota Entrevista
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Projeto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Nota Final
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Classificação
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-slate-500">
                  Nenhum dado encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="bg-white hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {row.candidateId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {row.researchThemeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {Number(row.ira).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {row.cvScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {row.interviewScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {row.projectScore ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {row.finalScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {row.rank}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
