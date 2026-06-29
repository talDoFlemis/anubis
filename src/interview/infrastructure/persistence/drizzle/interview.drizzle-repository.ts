import { DRIZZLE_TX } from '@/database/drizzle.constants';
import type { DrizzleDB } from '@/database/drizzle.provider';
import type {
  InterviewEvaluationInsert,
  InterviewEvaluationSelect,
} from '@/database/schema/interview-evaluations';
import { interviewEvaluations } from '@/database/schema/interview-evaluations';
import type {
  ProjectEvaluationInsert,
  ProjectEvaluationSelect,
} from '@/database/schema/project-evaluations';
import { projectEvaluations } from '@/database/schema/project-evaluations';
import { InterviewRepository } from '@/interview/interview.repository';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class InterviewDrizzleRepository implements InterviewRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async createInterviewEvaluation(
    data: InterviewEvaluationInsert,
  ): Promise<InterviewEvaluationSelect> {
    const [row] = await this.db
      .insert(interviewEvaluations)
      .values(data)
      .onConflictDoUpdate({
        target: [interviewEvaluations.evaluatorId, interviewEvaluations.candidateId],
        set: {
          decisionMaking: data.decisionMaking,
          problemAnalysis: data.problemAnalysis,
          oralCommunication: data.oralCommunication,
          researchWork: data.researchWork,
          technicalKnowledge: data.technicalKnowledge,
          observations: data.observations,
        },
      })
      .returning();

    return row;
  }

  async getInterviewEvaluationsByCandidateId(
    candidateId: string,
  ): Promise<InterviewEvaluationSelect[]> {
    return this.db
      .select()
      .from(interviewEvaluations)
      .where(eq(interviewEvaluations.candidateId, candidateId));
  }

  async getInterviewEvaluationsByEvaluatorId(
    evaluatorId: string,
  ): Promise<InterviewEvaluationSelect[]> {
    return this.db
      .select()
      .from(interviewEvaluations)
      .where(eq(interviewEvaluations.evaluatorId, evaluatorId));
  }

  async createProjectEvaluation(data: ProjectEvaluationInsert): Promise<ProjectEvaluationSelect> {
    const [row] = await this.db
      .insert(projectEvaluations)
      .values(data)
      .onConflictDoUpdate({
        target: [projectEvaluations.evaluatorId, projectEvaluations.candidateId],
        set: {
          criterion1: data.criterion1,
          criterion2: data.criterion2,
          criterion3: data.criterion3,
          criterion4: data.criterion4,
          criterion5: data.criterion5,
          observations: data.observations,
        },
      })
      .returning();

    return row;
  }

  async getProjectEvaluationsByCandidateId(
    candidateId: string,
  ): Promise<ProjectEvaluationSelect[]> {
    return this.db
      .select()
      .from(projectEvaluations)
      .where(eq(projectEvaluations.candidateId, candidateId));
  }

  async getProjectEvaluationsByEvaluatorId(
    evaluatorId: string,
  ): Promise<ProjectEvaluationSelect[]> {
    return this.db
      .select()
      .from(projectEvaluations)
      .where(eq(projectEvaluations.evaluatorId, evaluatorId));
  }
}
