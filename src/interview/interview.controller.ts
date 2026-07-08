import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InterviewService } from './interview.service';

import { InterviewEvaluationDto } from './dto/interview-evaluation.dto';
import { ProjectEvaluationDto } from './dto/project-evaluation.dto';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

import { RolesGuard } from '../roles/roles.guard';

import { Roles } from '../roles/roles.decorator';

import { RoleEnum } from '../roles/roles.enum';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { User } from '../users/domain/user';

@Controller({ path: 'interview', version: '1' })
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  // POST /interview/evaluation/:candidateId
  @Post(':candidateId/evaluation')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(RoleEnum.professor)
  async createInterviewEvaluation(
    @Param('candidateId') candidateId: string,
    @Body() dto: InterviewEvaluationDto,
    @CurrentUser() user: User,
  ) {
    return this.interviewService.createInterviewEvaluation(user.id, candidateId, dto);
  }

  // POST /interview/project-evaluation/:candidateId
  @Post(':candidateId/project-evaluation')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(RoleEnum.professor)
  async createProjectEvaluation(
    @Param('candidateId') candidateId: string,
    @Body() dto: ProjectEvaluationDto,
    @CurrentUser() user: User,
  ) {
    return this.interviewService.createProjectEvaluation(user.id, candidateId, dto);
  }

  // GET /interview/evaluations/:candidateId
  @Get(':candidateId/evaluations')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(RoleEnum.professor)
  async getInterviewEvaluations(@Param('candidateId') candidateId: string) {
    return this.interviewService.getInterviewEvaluationsByCandidateId(candidateId);
  }

  // GET /interview/project-evaluations/:candidateId
  @Get(':candidateId/project-evaluations')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(RoleEnum.professor)
  async getProjectEvaluations(@Param('candidateId') candidateId: string) {
    return this.interviewService.getProjectEvaluationsByCandidateId(candidateId);
  }

  // GET /interview/average/:candidateId
  @Get(':candidateId/average')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(RoleEnum.professor)
  async getInterviewAverage(@Param('candidateId') candidateId: string) {
    return this.interviewService.calculateInterviewAverages(candidateId);
  }

  // GET /interview/project-average/:candidateId
  @Get(':candidateId/project-average')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(RoleEnum.professor)
  async getProjectAverage(@Param('candidateId') candidateId: string) {
    return this.interviewService.calculateProjectAverages(candidateId);
  }
}
