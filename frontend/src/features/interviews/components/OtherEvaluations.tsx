import type { InterviewEvaluation } from '@/lib/api';
import { CONCEPT_LABELS, CONCEPT_SCORE } from '@/lib/api/interviews';

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

function getConceptValue(e: InterviewEvaluation, key: string): string {
  const value = (e as any)[key];
  return typeof value === 'string' ? value : 'REGULAR';
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
      const values = sortedEvals.map(e => {
        const concept = getConceptValue(e, key);
        return CONCEPT_SCORE[concept as keyof typeof CONCEPT_SCORE] || 0;
      });
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

              {/* Grid de conceitos */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {ASPECT_KEYS.map(key => {
                  const concept = getConceptValue(e, key);
                  const score = CONCEPT_SCORE[concept as keyof typeof CONCEPT_SCORE] || 0;
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-2 text-center ${isMyEval ? 'border-emerald-100 bg-white' : 'border-slate-100 bg-slate-50/50'}`}
                    >
                      <p className="text-[11px] font-medium text-slate-500 leading-tight mb-1">
                        {ASPECT_LABELS[key]}
                      </p>
                      <p
                        className={`text-sm font-bold ${score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-amber-600' : 'text-red-500'}`}
                      >
                        {CONCEPT_LABELS[concept as keyof typeof CONCEPT_LABELS] ?? concept}
                      </p>
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

      {/* Média geral */}
      {sortedEvals.length > 0 && (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-indigo-800">Média geral por aspecto</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {ASPECT_KEYS.map(key => (
              <div
                key={key}
                className="rounded-lg border border-indigo-100 bg-white p-2 text-center"
              >
                <p className="text-[11px] font-medium text-indigo-500 leading-tight mb-1">
                  {ASPECT_LABELS[key]}
                </p>
                <p className="text-sm font-bold text-indigo-700">{averages[key].toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
