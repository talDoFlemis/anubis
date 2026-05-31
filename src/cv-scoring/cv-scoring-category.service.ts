import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import { cvScoringCategories } from '../database/schema/cv-scoring';
import { CvScoringCategory } from './domain/cv-scoring-category';
import type { CreateCvScoringCategoryDto } from './dto/create-cv-scoring-category.dto';
import type { UpdateCvScoringCategoryDto } from './dto/update-cv-scoring-category.dto';

@Injectable()
export class CvScoringCategoryService {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async create(periodId: string, dto: CreateCvScoringCategoryDto): Promise<CvScoringCategory> {
    const [row] = await this.db
      .insert(cvScoringCategories)
      .values({
        enrollmentPeriodId: periodId,
        name: dto.name,
        description: dto.description,
        pointsPerItem: String(dto.pointsPerItem),
        maxPoints: String(dto.maxPoints),
        level: dto.level,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    return CvScoringCategory.toDomain(row);
  }

  async findByPeriodAndLevel(periodId: string, level: string): Promise<CvScoringCategory[]> {
    const rows = await this.db
      .select()
      .from(cvScoringCategories)
      .where(
        and(
          eq(cvScoringCategories.enrollmentPeriodId, periodId),
          eq(cvScoringCategories.level, level as 'masters' | 'doctoral'),
        ),
      )
      .orderBy(cvScoringCategories.sortOrder);

    return rows.map(row => CvScoringCategory.toDomain(row));
  }

  async findAllByPeriod(periodId: string): Promise<CvScoringCategory[]> {
    const rows = await this.db
      .select()
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.enrollmentPeriodId, periodId))
      .orderBy(cvScoringCategories.sortOrder);

    return rows.map(row => CvScoringCategory.toDomain(row));
  }

  async findById(id: string): Promise<CvScoringCategory> {
    const [row] = await this.db
      .select()
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Categoria de pontuação não encontrada.');
    }

    return CvScoringCategory.toDomain(row);
  }

  async update(id: string, dto: UpdateCvScoringCategoryDto): Promise<CvScoringCategory> {
    await this.findById(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.pointsPerItem !== undefined) updateData.pointsPerItem = String(dto.pointsPerItem);
    if (dto.maxPoints !== undefined) updateData.maxPoints = String(dto.maxPoints);
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [row] = await this.db
      .update(cvScoringCategories)
      .set(updateData)
      .where(eq(cvScoringCategories.id, id))
      .returning();

    return CvScoringCategory.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.db.delete(cvScoringCategories).where(eq(cvScoringCategories.id, id));
  }

  async copyFromPeriod(
    sourcePeriodId: string,
    targetPeriodId: string,
  ): Promise<CvScoringCategory[]> {
    const sourceCategories = await this.db
      .select()
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.enrollmentPeriodId, sourcePeriodId));

    if (sourceCategories.length === 0) {
      throw new NotFoundException('Nenhuma categoria encontrada no período de origem.');
    }

    const newRows = await this.db
      .insert(cvScoringCategories)
      .values(
        sourceCategories.map(cat => ({
          enrollmentPeriodId: targetPeriodId,
          name: cat.name,
          description: cat.description,
          pointsPerItem: cat.pointsPerItem,
          maxPoints: cat.maxPoints,
          level: cat.level,
          sortOrder: cat.sortOrder,
        })),
      )
      .returning();

    return newRows.map(row => CvScoringCategory.toDomain(row));
  }
}
