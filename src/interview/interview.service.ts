import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { InterviewRepository } from './interview.repository';

import { Inject, Logger } from '@nestjs/common';

import { UsersService } from '../users/users.service';

import { INTERVIEW_REPOSITORY } from './interview.constants';

import { RoleEnum } from '../roles/roles.enum';
import { InterviewEvaluationDto } from './dto/interview-evaluation.dto';
import { ProjectEvaluationDto } from './dto/project-evaluation.dto';

import { EnrollmentRepository } from 'src/enrollment/infrastructure/persistence/enrollment.repository';

const CONCEPT_SCORE_MAP: Record<string, number> = {
  FRACO: 4,
  REGULAR: 6,
  BOM: 8,
  OTIMO: 10,
};

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    @Inject(INTERVIEW_REPOSITORY) private readonly interviewRepo: InterviewRepository,
    private readonly usersService: UsersService,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  private async assertProfessorIsAuthorized(evaluatorId: string, candidateId: string) {
    const enrollments = await this.enrollmentRepository.findByCandidateId(candidateId);
    const validEnrollment = enrollments.find(e => e.status === 'submitted');

    if (!validEnrollment) {
      throw new NotFoundException('Inscrição do candidato não encontrada ou não submetida.');
    }

    const isAuthorized = await this.enrollmentRepository.isProfessorLinkedToEnrollment(
      validEnrollment.id,
      evaluatorId,
    );

    if (!isAuthorized) {
      throw new ForbiddenException('Você não tem permissão para avaliar este candidato.');
    }
  }

  async createInterviewEvaluation(
    evaluatorId: string,
    candidateId: string,
    dto: InterviewEvaluationDto,
  ) {
    this.logger.debug({ evaluatorId, candidateId }, 'Creating interview evaluation');

    const evaluator = await this.usersService.findById(evaluatorId);
    if (!evaluator) {
      throw new NotFoundException('Avaliador não encontrado.');
    }
    if (evaluator.role !== RoleEnum.professor) {
      throw new ForbiddenException('Apenas professores podem avaliar entrevistas.');
    }

    const candidate = await this.usersService.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException('Candidato não encontrado.');
    }

    await this.assertProfessorIsAuthorized(evaluatorId, candidateId);

    const evalData = {
      candidateId,
      evaluatorId,
      decisionMaking: dto.decisionMaking,
      problemAnalysis: dto.problemAnalysis,
      oralCommunication: dto.oralCommunication,
      researchWork: dto.researchWork,
      technicalKnowledge: dto.technicalKnowledge,
      observations: dto.observations ?? null,
    };

    const result = await this.interviewRepo.createInterviewEvaluation(evalData);
    this.logger.log(
      { evaluationId: result.id, evaluatorId, candidateId },
      'Interview evaluation created',
    );
    return result;
  }

  async createProjectEvaluation(
    evaluatorId: string,
    candidateId: string,
    dto: ProjectEvaluationDto,
  ) {
    this.logger.debug({ evaluatorId, candidateId }, 'Creating project evaluation');

    const evaluator = await this.usersService.findById(evaluatorId);
    if (!evaluator) {
      throw new NotFoundException('Avaliador não encontrado.');
    }
    if (evaluator.role !== RoleEnum.professor) {
      throw new ForbiddenException('Apenas professores podem avaliar projetos.');
    }

    const candidate = await this.usersService.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException('Candidato não encontrado.');
    }

    const evalData = {
      candidateId,
      evaluatorId,
      criterion1: dto.criterion1,
      criterion2: dto.criterion2,
      criterion3: dto.criterion3,
      criterion4: dto.criterion4,
      criterion5: dto.criterion5,
      observations: dto.observations ?? null,
    };

    const result = await this.interviewRepo.createProjectEvaluation(evalData);
    this.logger.log(
      { evaluationId: result.id, evaluatorId, candidateId },
      'Project evaluation created',
    );
    return result;
  }

  async getInterviewEvaluationsByCandidateId(candidateId: string) {
    return this.interviewRepo.getInterviewEvaluationsByCandidateId(candidateId);
  }

  async getProjectEvaluationsByCandidateId(candidateId: string) {
    return this.interviewRepo.getProjectEvaluationsByCandidateId(candidateId);
  }

  async getInterviewEvaluationsByEvaluatorId(evaluatorId: string) {
    return this.interviewRepo.getInterviewEvaluationsByEvaluatorId(evaluatorId);
  }

  async getProjectEvaluationsByEvaluatorId(evaluatorId: string) {
    return this.interviewRepo.getProjectEvaluationsByEvaluatorId(evaluatorId);
  }

  async calculateInterviewAverages(candidateId: string) {
    const evals = await this.getInterviewEvaluationsByCandidateId(candidateId);
    if (evals.length === 0) {
      return null;
    }
    const sum = evals.reduce(
      (acc, cur) => ({
        decisionMaking:
          acc.decisionMaking +
          (CONCEPT_SCORE_MAP[cur.decisionMaking as keyof typeof CONCEPT_SCORE_MAP] || 0),
        problemAnalysis:
          acc.problemAnalysis +
          (CONCEPT_SCORE_MAP[cur.problemAnalysis as keyof typeof CONCEPT_SCORE_MAP] || 0),
        oralCommunication:
          acc.oralCommunication +
          (CONCEPT_SCORE_MAP[cur.oralCommunication as keyof typeof CONCEPT_SCORE_MAP] || 0),
        researchWork:
          acc.researchWork +
          (CONCEPT_SCORE_MAP[cur.researchWork as keyof typeof CONCEPT_SCORE_MAP] || 0),
        technicalKnowledge:
          acc.technicalKnowledge +
          (CONCEPT_SCORE_MAP[cur.technicalKnowledge as keyof typeof CONCEPT_SCORE_MAP] || 0),
      }),
      {
        decisionMaking: 0,
        problemAnalysis: 0,
        oralCommunication: 0,
        researchWork: 0,
        technicalKnowledge: 0,
      },
    );

    const count = evals.length;
    const avg = {
      decisionMaking: sum.decisionMaking / count,
      problemAnalysis: sum.problemAnalysis / count,
      oralCommunication: sum.oralCommunication / count,
      researchWork: sum.researchWork / count,
      technicalKnowledge: sum.technicalKnowledge / count,
    };

    const overall =
      (avg.decisionMaking +
        avg.problemAnalysis +
        avg.oralCommunication +
        avg.researchWork +
        avg.technicalKnowledge) /
      5;

    return { perAspect: avg, overall };
  }

  async calculateProjectAverages(candidateId: string) {
    const evals = await this.getProjectEvaluationsByCandidateId(candidateId);
    if (evals.length === 0) {
      return null;
    }
    const sum = evals.reduce(
      (acc, cur) => ({
        c1: acc.c1 + (CONCEPT_SCORE_MAP[cur.criterion1 as keyof typeof CONCEPT_SCORE_MAP] || 0),
        c2: acc.c2 + (CONCEPT_SCORE_MAP[cur.criterion2 as keyof typeof CONCEPT_SCORE_MAP] || 0),
        c3: acc.c3 + (CONCEPT_SCORE_MAP[cur.criterion3 as keyof typeof CONCEPT_SCORE_MAP] || 0),
        c4: acc.c4 + (CONCEPT_SCORE_MAP[cur.criterion4 as keyof typeof CONCEPT_SCORE_MAP] || 0),
        c5: acc.c5 + (CONCEPT_SCORE_MAP[cur.criterion5 as keyof typeof CONCEPT_SCORE_MAP] || 0),
      }),
      {
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        c5: 0,
      },
    );

    const count = evals.length;
    const avg = {
      c1: sum.c1 / count,
      c2: sum.c2 / count,
      c3: sum.c3 / count,
      c4: sum.c4 / count,
      c5: sum.c5 / count,
    };

    const overall = (avg.c1 + avg.c2 + avg.c3 + avg.c4 + avg.c5) / 5;
    return { perAspect: avg, overall };
  }
}
