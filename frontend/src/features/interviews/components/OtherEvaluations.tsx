import type { InterviewEvaluation } from '@/lib/api';
import { CONCEPT_LABELS, scoreToConcept } from '@/lib/api/interviews';

interface OtherEvaluationsProps {
  evaluations: InterviewEvaluation[];
  currentEvaluatorId: string;
  candidateName: string;
}

const ASPECT_KEYS: (keyof InterviewEvaluation)[] = [
  'decisionMaking',
  'problemAnalysis',
  'oralCommunication',
  'researchWork',
  'technicalKnowledge',
];

const ASPECT_LABELS: Record<string, string> = {
  decisionMaking: 'Tomada de decisão',
  problemAnalysis: 'Análise de problemas e raciocínio lógico',
  oralCommunication: 'Comunicação oral',
  researchWork: 'Trabalho de pesquisa científica',
  technicalKnowledge: 'Conhecimentos teóricos e técnicos',
};

function getScoreValue(e: InterviewEvaluation, key: string): number {
  const value = (e as any)[key];
  return typeof value === 'number' ? value : Number(value) || 0;
}

export function OtherEvaluations({
  evaluations,
  currentEvaluatorId,
  candidateName,
}: OtherEvaluationsProps) {
  if (evaluations.length === 0) {
    return null;
  }

  const sortedEvals = [
    ...evaluations.filter(e => e.evaluatorId === currentEvaluatorId),
    ...evaluations.filter(e => e.evaluatorId !== currentEvaluatorId),
  ];

  // Calcula médias por aspecto
  const averages = ASPECT_KEYS.reduce(
    (acc, key) => {
      const values = sortedEvals.map(e => getScoreValue(e, key));
      acc[key] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-bold text-slate-900">Avaliações recebidas — {candidateName}</h3>
        <p className="text-sm text-slate-500">
          {evaluations.length} avaliador
          {evaluations.length !== 1 ? 'es' : ''} no total
        </p>
      </div>

      <div className="space-y-3">
        {sortedEvals.map((e, i) => {
          const isMyEval = e.evaluatorId === currentEvaluatorId;
          const evaluatorName = e.evaluatorName ?? e.evaluatorId;

          return (
            <div
              key={i}
              className={`rounded-lg border p-4 ${isMyEval ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}
            >
              {/* Cabeçalho do avaliador */}
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">{evaluatorName}</h4>
                {isMyEval && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    Você
                  </span>
                )}
              </div>

              {/* Grid de notas numéricas */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {ASPECT_KEYS.map(key => {
                  const score = getScoreValue(e, key);
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-2 text-center ${isMyEval ? 'border-emerald-100 bg-white' : 'border-slate-100 bg-slate-50/50'}`}
                    >
                      <p className="text-[11px] font-medium text-slate-500 leading-tight mb-1">
                        {ASPECT_LABELS[key]}
                      </p>
                      <p className="text-sm font-bold text-slate-800">{score.toFixed(1)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Observações */}
              {e.observations && (
                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                  <p className="text-xs italic text-slate-600">{e.observations}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Média geral por aspecto - AQUI mostramos os conceitos */}
      {sortedEvals.length > 0 && (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-indigo-800">Média geral por aspecto</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {ASPECT_KEYS.map(key => {
              const avgScore = averages[key];
              const concept = scoreToConcept(avgScore);
              const conceptLabel = CONCEPT_LABELS[concept];
              return (
                <div
                  key={key}
                  className="rounded-lg border border-indigo-100 bg-white p-2 text-center"
                >
                  <p className="text-[11px] font-medium text-indigo-500 leading-tight mb-1">
                    {ASPECT_LABELS[key]}
                  </p>
                  <p className="text-sm font-bold text-indigo-700">{avgScore.toFixed(2)}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1 ${
                      concept === 'OTIMO'
                        ? 'bg-emerald-100 text-emerald-700'
                        : concept === 'BOM'
                          ? 'bg-blue-100 text-blue-700'
                          : concept === 'REGULAR'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {conceptLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
