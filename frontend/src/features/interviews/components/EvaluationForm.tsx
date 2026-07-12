import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { ScoreInput } from './ScoreInput';

interface EvaluationFormProps {
  candidateName: string;
  candidateLevel: 'mestrado' | 'doutorado';
  isDoctoral: boolean;
  initialEvaluation?: {
    decisionMaking: number;
    problemAnalysis: number;
    oralCommunication: number;
    researchWork: number;
    technicalKnowledge: number;
    observations?: string | null;
  };
  initialProjectEvaluation?: {
    criterion1: number;
    criterion2: number;
    criterion3: number;
    criterion4: number;
    criterion5: number;
    observations?: string | null;
  };
  onSubmitEvaluation: (data: {
    decisionMaking: number;
    problemAnalysis: number;
    oralCommunication: number;
    researchWork: number;
    technicalKnowledge: number;
    observations?: string;
  }) => void;
  onSubmitProjectEvaluation?: (data: {
    criterion1: number;
    criterion2: number;
    criterion3: number;
    criterion4: number;
    criterion5: number;
    observations?: string;
  }) => void;
  isSubmitting: boolean;
  isSubmittingProject?: boolean;
}

export function EvaluationForm({
  candidateName,
  candidateLevel,
  isDoctoral,
  initialEvaluation,
  initialProjectEvaluation,
  onSubmitEvaluation,
  onSubmitProjectEvaluation,
  isSubmitting,
  isSubmittingProject,
}: EvaluationFormProps) {
  const [decisionMaking, setDecisionMaking] = useState<number>(
    initialEvaluation?.decisionMaking ?? 0,
  );
  const [problemAnalysis, setProblemAnalysis] = useState<number>(
    initialEvaluation?.problemAnalysis ?? 0,
  );
  const [oralCommunication, setOralCommunication] = useState<number>(
    initialEvaluation?.oralCommunication ?? 0,
  );
  const [researchWork, setResearchWork] = useState<number>(initialEvaluation?.researchWork ?? 0);
  const [technicalKnowledge, setTechnicalKnowledge] = useState<number>(
    initialEvaluation?.technicalKnowledge ?? 0,
  );
  const [observations, setObservations] = useState(initialEvaluation?.observations ?? '');

  // Project evaluation state (doutorado)
  const [criterion1, setCriterion1] = useState<number>(initialProjectEvaluation?.criterion1 ?? 0);
  const [criterion2, setCriterion2] = useState<number>(initialProjectEvaluation?.criterion2 ?? 0);
  const [criterion3, setCriterion3] = useState<number>(initialProjectEvaluation?.criterion3 ?? 0);
  const [criterion4, setCriterion4] = useState<number>(initialProjectEvaluation?.criterion4 ?? 0);
  const [criterion5, setCriterion5] = useState<number>(initialProjectEvaluation?.criterion5 ?? 0);
  const [projectObservations, setProjectObservations] = useState(
    initialProjectEvaluation?.observations ?? '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitEvaluation({
      decisionMaking,
      problemAnalysis,
      oralCommunication,
      researchWork,
      technicalKnowledge,
      observations: observations.trim() || undefined,
    });
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitProjectEvaluation) {
      onSubmitProjectEvaluation({
        criterion1,
        criterion2,
        criterion3,
        criterion4,
        criterion5,
        observations: projectObservations.trim() || undefined,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Interview Evaluation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-6 space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Avaliação de Arguição — {candidateName}
            </h3>
            <p className="text-sm text-slate-500">
              Candidato ao {candidateLevel === 'mestrado' ? 'Mestrado' : 'Doutorado'}
            </p>
          </div>

          <div className="space-y-3">
            <ScoreInput
              label="Tomada de decisão"
              value={decisionMaking}
              onChange={setDecisionMaking}
            />
            <ScoreInput
              label="Análise de problemas e raciocínio lógico"
              value={problemAnalysis}
              onChange={setProblemAnalysis}
            />
            <ScoreInput
              label="Comunicação oral"
              value={oralCommunication}
              onChange={setOralCommunication}
            />
            <ScoreInput
              label="Trabalho de pesquisa científica"
              value={researchWork}
              onChange={setResearchWork}
            />
            <ScoreInput
              label="Conhecimentos teóricos e técnicos para pesquisa no projeto temático"
              value={technicalKnowledge}
              onChange={setTechnicalKnowledge}
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="observations" className="text-sm font-semibold text-slate-700">
              Observações <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="observations"
              placeholder="Descreva detalhes ou justificativas para a avaliação (ex: 'Fala bem inglês, fez IC comigo')"
              value={observations}
              onChange={e => setObservations(e.target.value)}
              required
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting || !observations.trim()}>
              {isSubmitting
                ? 'Salvando...'
                : initialEvaluation
                  ? 'Atualizar Avaliação'
                  : 'Salvar Avaliação'}
            </Button>
          </div>
        </div>
      </form>

      {/* Project Evaluation Form (Doutorado only) */}
      {isDoctoral && onSubmitProjectEvaluation && (
        <form onSubmit={handleSubmitProject} className="space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs">
            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-bold text-amber-900">
                Avaliação de Projeto de Pesquisa — {candidateName}
              </h3>
              <p className="text-sm text-amber-700">
                Avaliação adicional obrigatória para candidatos ao Doutorado
              </p>
            </div>

            <div className="space-y-3">
              <ScoreInput label="Critério 1" value={criterion1} onChange={setCriterion1} />
              <ScoreInput label="Critério 2" value={criterion2} onChange={setCriterion2} />
              <ScoreInput label="Critério 3" value={criterion3} onChange={setCriterion3} />
              <ScoreInput label="Critério 4" value={criterion4} onChange={setCriterion4} />
              <ScoreInput label="Critério 5" value={criterion5} onChange={setCriterion5} />
            </div>

            <div className="mt-4 space-y-2">
              <Label
                htmlFor="project-observations"
                className="text-sm font-semibold text-amber-800"
              >
                Observações <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="project-observations"
                placeholder="Justifique ou detalhe a avaliação do projeto de pesquisa"
                value={projectObservations}
                onChange={e => setProjectObservations(e.target.value)}
                required
                rows={3}
                className="flex min-h-[60px] w-full rounded-md border border-amber-300 bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmittingProject || !projectObservations.trim()}
                className="bg-amber-700 hover:bg-amber-800"
              >
                {isSubmittingProject
                  ? 'Salvando...'
                  : initialProjectEvaluation
                    ? 'Atualizar Avaliação de Projeto'
                    : 'Salvar Avaliação de Projeto'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
