import { ClassificationRepository } from '@/classification/classification.repository';
import { DRIZZLE_TX } from '@/database/drizzle.constants';
import type { DrizzleDB } from '@/database/drizzle.provider';
import type { ClassificationInsert, ClassificationSelect } from '@/database/schema/classifications';
import { classifications } from '@/database/schema/classifications';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ClassificationDrizzleRepository implements ClassificationRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async create(data: ClassificationInsert): Promise<ClassificationSelect> {
    const [row] = await this.db.insert(classifications).values(data).returning();
    return row;
  }

  async getByCandidateId(candidateId: string): Promise<ClassificationSelect | null> {
    const result = await this.db
      .select()
      .from(classifications)
      .where(eq(classifications.candidateId, candidateId));
    return result.length > 0 ? result[0] : null;
  }

  async listByResearchTheme(
    researchThemeId: string,
    stage?: 'mestrado' | 'doutorado',
  ): Promise<ClassificationSelect[]> {
    if (stage) {
      return await this.db
        .select()
        .from(classifications)
        .where(
          and(
            eq(classifications.researchThemeId, researchThemeId),
            eq(classifications.stage, stage),
          ),
        );
    } else {
      return await this.db
        .select()
        .from(classifications)
        .where(eq(classifications.researchThemeId, researchThemeId));
    }
  }

  async listAllOrdered(): Promise<ClassificationSelect[]> {
    return await this.db.select().from(classifications).orderBy(classifications.rank);
  }

  async getRanking(dto?: {
    researchThemeId?: string;
    stage?: 'mestrado' | 'doutorado';
  }): Promise<ClassificationSelect[]> {
    if (dto?.researchThemeId && dto?.stage) {
      return await this.db
        .select()
        .from(classifications)
        .where(
          and(
            eq(classifications.researchThemeId, dto.researchThemeId),
            eq(classifications.stage, dto.stage),
          ),
        )
        .orderBy(classifications.researchThemeId, classifications.stage, classifications.rank);
    } else if (dto?.researchThemeId) {
      return await this.db
        .select()
        .from(classifications)
        .where(eq(classifications.researchThemeId, dto.researchThemeId))
        .orderBy(classifications.researchThemeId, classifications.stage, classifications.rank);
    } else if (dto?.stage) {
      return await this.db
        .select()
        .from(classifications)
        .where(eq(classifications.stage, dto.stage))
        .orderBy(classifications.researchThemeId, classifications.stage, classifications.rank);
    } else {
      return await this.db
        .select()
        .from(classifications)
        .orderBy(classifications.researchThemeId, classifications.stage, classifications.rank);
    }
  }
}
