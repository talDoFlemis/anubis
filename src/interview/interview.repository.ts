import type {
  InterviewEvaluationInsert,
  InterviewEvaluationSelect,
} from '@/database/schema/interview-evaluations';

import type {
  ProjectEvaluationInsert,
  ProjectEvaluationSelect,
} from '@/database/schema/project-evaluations';

export interface InterviewRepository {
  createInterviewEvaluation(data: InterviewEvaluationInsert): Promise<InterviewEvaluationSelect>;
  getInterviewEvaluationsByCandidateId(candidateId: string): Promise<InterviewEvaluationSelect[]>;
  getInterviewEvaluationsByEvaluatorId(evaluatorId: string): Promise<InterviewEvaluationSelect[]>;
  createProjectEvaluation(data: ProjectEvaluationInsert): Promise<ProjectEvaluationSelect>;
  getProjectEvaluationsByCandidateId(candidateId: string): Promise<ProjectEvaluationSelect[]>;
  getProjectEvaluationsByEvaluatorId(evaluatorId: string): Promise<ProjectEvaluationSelect[]>;
}
