import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { cvItems } from '../../../../database/schema/cv-items';
import type { CvScoringCategorySelect } from '../../../../database/schema/cv-scoring';
import { cvScoringCategories } from '../../../../database/schema/cv-scoring';
import type { EnrollmentSelect } from '../../../../database/schema/enrollments';
import { enrollments } from '../../../../database/schema/enrollments';
import { files } from '../../../../database/schema/files';
import { CvItem } from '../../../domain/cv-item';
import type { CreateCvItemData, UpdateCvItemData } from '../cv-item.repository';
import { CvItemRepository } from '../cv-item.repository';

@Injectable()
export class CvItemDrizzleRepository extends CvItemRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateCvItemData): Promise<CvItem> {
    const [row] = await this.db
      .insert(cvItems)
      .values({
        enrollmentId: data.enrollmentId,
        scoringCategoryId: data.scoringCategoryId,
        description: data.description,
        quantity: data.quantity,
        proofFileId: data.proofFileId,
      })
      .returning();

    return CvItem.toDomain(row);
  }

  async findByEnrollment(enrollmentId: string): Promise<CvItem[]> {
    const rows = await this.db
      .select({
        cvItem: cvItems,
        proofFileName: files.originalName,
      })
      .from(cvItems)
      .leftJoin(files, eq(cvItems.proofFileId, files.id))
      .where(eq(cvItems.enrollmentId, enrollmentId))
      .orderBy(cvItems.createdAt);

    return rows.map(row => CvItem.toDomain({ ...row.cvItem, proofFileName: row.proofFileName }));
  }

  async findById(itemId: string): Promise<CvItem | null> {
    const [row] = await this.db.select().from(cvItems).where(eq(cvItems.id, itemId)).limit(1);

    if (!row) return null;

    return CvItem.toDomain(row);
  }

  async update(itemId: string, data: UpdateCvItemData): Promise<CvItem> {
    const updateData: Record<string, unknown> = { updatedAt: data.updatedAt };
    if (data.description !== undefined) updateData.description = data.description;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.scoringCategoryId !== undefined) updateData.scoringCategoryId = data.scoringCategoryId;
    if (data.proofFileId !== undefined) updateData.proofFileId = data.proofFileId;

    const [row] = await this.db
      .update(cvItems)
      .set(updateData)
      .where(eq(cvItems.id, itemId))
      .returning();

    return CvItem.toDomain(row);
  }

  async remove(itemId: string): Promise<void> {
    await this.db.delete(cvItems).where(eq(cvItems.id, itemId));
  }

  async findEnrollmentById(enrollmentId: string): Promise<EnrollmentSelect | null> {
    const [row] = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);

    return row ?? null;
  }

  async findScoringCategoryById(categoryId: string): Promise<CvScoringCategorySelect | null> {
    const [row] = await this.db
      .select()
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.id, categoryId))
      .limit(1);

    return row ?? null;
  }

  async updateEnrollmentScore(enrollmentId: string, scoreDraft: string): Promise<void> {
    await this.db
      .update(enrollments)
      .set({
        scoreDraft,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId));
  }
}
