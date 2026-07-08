import { CvScoringService } from '@/cv-scoring/cv-scoring.service';
import { DRIZZLE_TX } from '@/database/drizzle.constants';
import type { DrizzleDB } from '@/database/drizzle.provider';
import type { ClassificationInsert, ClassificationSelect } from '@/database/schema/classifications';
import { classifications } from '@/database/schema/classifications';
import { ENROLLMENT_STATUS } from '@/enrollment/constants/enrollment-status';
import { EnrollmentService } from '@/enrollment/enrollment.service';
import { InterviewService } from '@/interview/interview.service';
import { ResearchThemeService } from '@/research-theme/research-theme.service';
import { UsersService } from '@/users/users.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import type { TriggerClassificationDto } from './dto/trigger-classification.dto';
import { ClassificationDrizzleRepository } from './infrastructure/persistence/drizzle/classification.drizzle-repository';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  constructor(
    @Inject(DRIZZLE_TX) private readonly db: DrizzleDB,
    private readonly classificationRepo: ClassificationDrizzleRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly usersService: UsersService,
    private readonly cvScoringService: CvScoringService,
    private readonly interviewService: InterviewService,
    private readonly researchThemeService: ResearchThemeService,
  ) {}

  async triggerClassification(dto?: TriggerClassificationDto): Promise<ClassificationSelect[]> {
    const candidateIds = await this.getCandidateIdsToProcess(dto);
    if (candidateIds.length === 0) return [];

    await this.db.delete(classifications).where(inArray(classifications.candidateId, candidateIds));

    const insertedClassifications: ClassificationSelect[] = [];

    for (const candidateId of candidateIds) {
      const candidateDataArray = await this.calculateCandidateData(candidateId);
      if (!candidateDataArray || candidateDataArray.length === 0) continue;

      for (const data of candidateDataArray) {
        const inserted = await this.classificationRepo.create(data);
        insertedClassifications.push(inserted);
      }
    }

    const grouped = this.groupByThemeAndStage(insertedClassifications);

    for (const classArray of grouped.values()) {
      const sorted = [...classArray].sort((a, b) => {
        const diffFinal = Number(b.finalScore) - Number(a.finalScore);
        if (diffFinal !== 0) return diffFinal;

        const diffInterview = Number(b.interviewScore) - Number(a.interviewScore);
        if (diffInterview !== 0) return diffInterview;

        const diffProject = Number(b.projectScore || 0) - Number(a.projectScore || 0);
        if (diffProject !== 0) return diffProject;

        return Number(b.cvScore) - Number(a.cvScore);
      });

      for (const [index, cls] of sorted.entries()) {
        const newRank = index + 1;
        await this.db
          .update(classifications)
          .set({ rank: newRank })
          .where(eq(classifications.id, cls.id));
        cls.rank = newRank;
      }
    }

    return insertedClassifications;
  }

  private async calculateCandidateData(candidateId: string): Promise<ClassificationInsert[]> {
    const enrollments = await this.enrollmentService.findMine(candidateId);
    const sub = enrollments
      .filter(e => e.status === ENROLLMENT_STATUS.SUBMITTED)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!sub || !sub.primaryThemeId) return [];

    const ira = Number(sub.ira) || 0;
    let cvScore = 0;
    try {
      if (sub.scoreValidated !== null) {
        cvScore = Number(sub.scoreValidated);
        if (isNaN(cvScore)) {
          this.logger.warn(`Invalid CV score for candidate ${candidateId}: ${sub.scoreValidated}`);
          cvScore = 0;
        }
      } else {
        this.logger.warn(`No CV score found for candidate ${candidateId}`);
        cvScore = 0;
      }
    } catch (error) {
      this.logger.error(`Failed to get CV score for candidate ${candidateId}`, error as Error);
      cvScore = 0;
    }

    const intAvg = await this.interviewService.calculateInterviewAverages(candidateId);
    const interview = Number(intAvg?.overall) || 0;

    let project = 0;
    if (sub.level === 'doctoral') {
      const projAvg = await this.interviewService.calculateProjectAverages(candidateId);
      project = Number(projAvg?.overall) || 0;
    }

    const finalScore = this.computeFormula(
      sub.level as 'mestrado' | 'doutorado',
      ira,
      cvScore,
      interview,
      project,
    );

    const inserts: ClassificationInsert[] = [];

    const baseData = {
      candidateId,
      interviewScore: interview.toFixed(2),
      cvScore: cvScore.toFixed(2),
      ira: ira.toFixed(2),
      projectScore: sub.level === 'doctoral' ? project.toFixed(2) : null,
      finalScore: finalScore.toFixed(2),
      rank: 0,
      stage: sub.level === 'doctoral' ? 'doutorado' : 'mestrado',
    } as ClassificationInsert;

    inserts.push({
      ...baseData,
      researchThemeId: sub.primaryThemeId,
    });

    if (sub.secondaryThemeId) {
      inserts.push({
        ...baseData,
        researchThemeId: sub.secondaryThemeId,
      });
    }

    return inserts;
  }

  private computeFormula(
    stage: 'mestrado' | 'doutorado',
    ira: number,
    cv: number,
    int: number,
    proj: number,
  ): number {
    const score =
      stage === 'mestrado'
        ? 0.3 * ira + 0.4 * cv + 0.3 * int
        : 0.25 * ira + 0.3 * cv + 0.25 * int + 0.2 * proj;
    return Math.max(0, Math.min(10, score));
  }

  private groupByThemeAndStage(items: ClassificationSelect[]) {
    const map = new Map<string, ClassificationSelect[]>();
    items.forEach(item => {
      const key = `${item.researchThemeId}-${item.stage}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }

  private async getCandidateIdsToProcess(dto?: TriggerClassificationDto): Promise<string[]> {
    const all = (await this.enrollmentService.findAll({})).data.filter(
      e => e.status === ENROLLMENT_STATUS.SUBMITTED,
    );

    let ids = all.map(e => e.candidateId);
    if (dto?.researchThemeId) {
      ids = all
        .filter(
          e =>
            e.primaryThemeId === dto.researchThemeId || e.secondaryThemeId === dto.researchThemeId,
        )
        .map(e => e.candidateId);
    }
    if (dto?.stage) {
      const levelMap: Record<string, string> = {
        mestrado: 'masters',
        doutorado: 'doctoral',
      };
      ids = all.filter(e => e.level === levelMap[dto.stage!]).map(e => e.candidateId);
    }

    return [...new Set(ids)];
  }

  async getRanking(
    dto?: {
      researchThemeId?: string;
      stage?: 'mestrado' | 'doutorado';
    },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    data: ClassificationSelect[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    const allRankings = await this.classificationRepo.getRanking(dto);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 1000;
    const total = allRankings.length;
    const lastPage = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = allRankings.slice(start, start + limit);

    return {
      data,
      meta: { total, page, lastPage },
    };
  }
}
