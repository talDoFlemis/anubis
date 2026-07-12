import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { InterviewRepository } from './interview.repository';

import { Inject, Logger } from '@nestjs/common';

import { UsersService } from '../users/users.service';

import { INTERVIEW_REPOSITORY } from './interview.constants';

import { RoleEnum } from '../roles/roles.enum';
import { InterviewEvaluationDto } from './dto/interview-evaluation.dto';
import { ProjectEvaluationDto } from './dto/project-evaluation.dto';

import { EnrollmentRepository } from 'src/enrollment/infrastructure/persistence/enrollment.repository';

function scoreToConcept(score: number): string {
  if (score >= 8) return 'OTIMO';
  if (score >= 6) return 'BOM';
  if (score >= 4) return 'REGULAR';
  return 'FRACO';
}

const ASPECT_LABELS: Record<string, string> = {
  decisionMaking: 'Tomada de decisão',
  problemAnalysis: 'Análise de problemas e raciocínio lógico',
  oralCommunication: 'Comunicação oral',
  researchWork: 'Trabalho de pesquisa científica',
  technicalKnowledge: 'Conhecimentos teóricos e técnicos',
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
      decisionMaking: dto.decisionMaking.toFixed(2),
      problemAnalysis: dto.problemAnalysis.toFixed(2),
      oralCommunication: dto.oralCommunication.toFixed(2),
      researchWork: dto.researchWork.toFixed(2),
      technicalKnowledge: dto.technicalKnowledge.toFixed(2),
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
      criterion1: dto.criterion1.toFixed(2),
      criterion2: dto.criterion2.toFixed(2),
      criterion3: dto.criterion3.toFixed(2),
      criterion4: dto.criterion4.toFixed(2),
      criterion5: dto.criterion5.toFixed(2),
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
    const evaluations = await this.interviewRepo.getInterviewEvaluationsByCandidateId(candidateId);

    // Enriquecer com dados do avaliador
    const enriched = await Promise.all(
      evaluations.map(async ev => {
        const evaluator = await this.usersService.findById(ev.evaluatorId);
        return {
          ...ev,
          evaluatorName: evaluator
            ? `${evaluator.firstName ?? ''} ${evaluator.lastName ?? ''}`.trim()
            : null,
        };
      }),
    );

    return enriched;
  }

  async getProjectEvaluationsByCandidateId(candidateId: string) {
    const evaluations = await this.interviewRepo.getProjectEvaluationsByCandidateId(candidateId);

    // Enriquecer com dados do avaliador
    const enriched = await Promise.all(
      evaluations.map(async ev => {
        const evaluator = await this.usersService.findById(ev.evaluatorId);
        return {
          ...ev,
          evaluatorName: evaluator
            ? `${evaluator.firstName ?? ''} ${evaluator.lastName ?? ''}`.trim()
            : null,
        };
      }),
    );

    return enriched;
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
        decisionMaking: acc.decisionMaking + Number(cur.decisionMaking),
        problemAnalysis: acc.problemAnalysis + Number(cur.problemAnalysis),
        oralCommunication: acc.oralCommunication + Number(cur.oralCommunication),
        researchWork: acc.researchWork + Number(cur.researchWork),
        technicalKnowledge: acc.technicalKnowledge + Number(cur.technicalKnowledge),
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
    const perAspect = {
      decisionMaking: sum.decisionMaking / count,
      problemAnalysis: sum.problemAnalysis / count,
      oralCommunication: sum.oralCommunication / count,
      researchWork: sum.researchWork / count,
      technicalKnowledge: sum.technicalKnowledge / count,
    };

    const overall =
      (perAspect.decisionMaking +
        perAspect.problemAnalysis +
        perAspect.oralCommunication +
        perAspect.researchWork +
        perAspect.technicalKnowledge) /
      5;

    return { perAspect, overall, perAspectConcepts: this.aspectsToConcepts(perAspect) };
  }

  async calculateProjectAverages(candidateId: string) {
    const evals = await this.getProjectEvaluationsByCandidateId(candidateId);
    if (evals.length === 0) {
      return null;
    }
    const sum = evals.reduce(
      (acc, cur) => ({
        c1: acc.c1 + Number(cur.criterion1),
        c2: acc.c2 + Number(cur.criterion2),
        c3: acc.c3 + Number(cur.criterion3),
        c4: acc.c4 + Number(cur.criterion4),
        c5: acc.c5 + Number(cur.criterion5),
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
    const perAspect = {
      c1: sum.c1 / count,
      c2: sum.c2 / count,
      c3: sum.c3 / count,
      c4: sum.c4 / count,
      c5: sum.c5 / count,
    };

    const overall = (perAspect.c1 + perAspect.c2 + perAspect.c3 + perAspect.c4 + perAspect.c5) / 5;
    return { perAspect, overall, perAspectConcepts: this.projectAspectsToConcepts(perAspect) };
  }

  private aspectsToConcepts(
    averages: Record<string, number>,
  ): Record<string, { score: number; concept: string; label: string }> {
    const result: Record<string, { score: number; concept: string; label: string }> = {};
    for (const [key, value] of Object.entries(averages)) {
      result[key] = {
        score: Math.round(value * 100) / 100,
        concept: scoreToConcept(value),
        label: ASPECT_LABELS[key] ?? key,
      };
    }
    return result;
  }

  private projectAspectsToConcepts(
    averages: Record<string, number>,
  ): Record<string, { score: number; concept: string; label: string }> {
    const labels: Record<string, string> = {
      c1: 'Critério 1',
      c2: 'Critério 2',
      c3: 'Critério 3',
      c4: 'Critério 4',
      c5: 'Critério 5',
    };
    const result: Record<string, { score: number; concept: string; label: string }> = {};
    for (const [key, value] of Object.entries(averages)) {
      result[key] = {
        score: Math.round(value * 100) / 100,
        concept: scoreToConcept(value),
        label: labels[key] ?? key,
      };
    }
    return result;
  }
}
