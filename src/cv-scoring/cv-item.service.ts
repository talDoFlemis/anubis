import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { CreateCvItemDto } from './dto/create-cv-item.dto';
import type { UpdateCvItemDto } from './dto/update-cv-item.dto';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import { cvItems } from '../database/schema/cv-items';
import { cvScoringCategories } from '../database/schema/cv-scoring';
import { enrollments } from '../database/schema/enrollments';
import { files } from '../database/schema/files';
import { FileStorageService } from '../file-storage/file-storage.service';
import { CvScoringService } from './cv-scoring.service';
import { CvItem } from './domain/cv-item';

@Injectable()
export class CvItemService {
  constructor(
    @Inject(DRIZZLE_TX) private readonly db: DrizzleDB,
    private readonly cvScoringService: CvScoringService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(
    userId: string,
    enrollmentId: string,
    dto: CreateCvItemDto,
    file?: Express.Multer.File,
  ): Promise<CvItem> {
    const enrollment = await this.getAndValidateEnrollment(enrollmentId, userId);

    await this.validateScoringCategory(
      dto.scoringCategoryId,
      enrollment.enrollmentPeriodId,
      enrollment.level,
    );

    let proofFileId: string | null = null;
    if (file) {
      const fileRecord = await this.fileStorageService.upload(file, userId, 'cv-items');
      proofFileId = fileRecord.id;
    }

    const [row] = await this.db
      .insert(cvItems)
      .values({
        enrollmentId,
        scoringCategoryId: dto.scoringCategoryId,
        description: dto.description,
        quantity: dto.quantity ?? 1,
        proofFileId,
      })
      .returning();

    await this.recalculateScore(enrollmentId);
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

  async findById(enrollmentId: string, itemId: string): Promise<CvItem> {
    const [row] = await this.db.select().from(cvItems).where(eq(cvItems.id, itemId)).limit(1);

    if (!row || row.enrollmentId !== enrollmentId) {
      throw new NotFoundException('Item do CV não encontrado.');
    }

    return CvItem.toDomain(row);
  }

  async update(
    userId: string,
    enrollmentId: string,
    itemId: string,
    dto: UpdateCvItemDto,
    file?: Express.Multer.File,
  ): Promise<CvItem> {
    await this.getAndValidateEnrollment(enrollmentId, userId);
    const existingItem = await this.findById(enrollmentId, itemId);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.scoringCategoryId !== undefined) {
      const enrollment = await this.getEnrollment(enrollmentId);
      await this.validateScoringCategory(
        dto.scoringCategoryId,
        enrollment.enrollmentPeriodId,
        enrollment.level,
      );
      updateData.scoringCategoryId = dto.scoringCategoryId;
    }

    if (file) {
      if (existingItem.proofFileId) {
        await this.fileStorageService.delete(existingItem.proofFileId);
      }
      const fileRecord = await this.fileStorageService.upload(file, userId, 'cv-items');
      updateData.proofFileId = fileRecord.id;
    }

    const [row] = await this.db
      .update(cvItems)
      .set(updateData)
      .where(eq(cvItems.id, itemId))
      .returning();

    await this.recalculateScore(enrollmentId);
    return CvItem.toDomain(row);
  }

  async remove(userId: string, enrollmentId: string, itemId: string): Promise<void> {
    await this.getAndValidateEnrollment(enrollmentId, userId);
    const item = await this.findById(enrollmentId, itemId);

    if (item.proofFileId) {
      await this.fileStorageService.delete(item.proofFileId);
    }

    await this.db.delete(cvItems).where(eq(cvItems.id, itemId));
    await this.recalculateScore(enrollmentId);
  }

  private async getEnrollment(enrollmentId: string) {
    const [enrollment] = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment) {
      throw new NotFoundException('Inscrição não encontrada.');
    }
    return enrollment;
  }

  private async getAndValidateEnrollment(enrollmentId: string, userId: string) {
    const enrollment = await this.getEnrollment(enrollmentId);

    if (enrollment.candidateId !== userId) {
      throw new ForbiddenException('Você não tem permissão para modificar esta inscrição.');
    }

    if (enrollment.status !== 'draft') {
      throw new BadRequestException('Apenas inscrições em rascunho podem ser editadas.');
    }

    return enrollment;
  }

  private async validateScoringCategory(
    categoryId: string,
    periodId: string,
    level: string,
  ): Promise<void> {
    const [category] = await this.db
      .select()
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new NotFoundException('Categoria de pontuação não encontrada.');
    }

    if (category.enrollmentPeriodId !== periodId) {
      throw new BadRequestException('A categoria não pertence ao período desta inscrição.');
    }

    if (category.level !== level) {
      throw new BadRequestException('A categoria não corresponde ao nível desta inscrição.');
    }
  }

  private async recalculateScore(enrollmentId: string): Promise<void> {
    const enrollment = await this.getEnrollment(enrollmentId);
    const items = await this.findByEnrollment(enrollmentId);
    const categories = await this.cvScoringService.getCategoriesForPeriod(
      enrollment.enrollmentPeriodId,
      enrollment.level,
    );

    const scoringItems = items.map(item => ({
      scoringCategoryId: item.scoringCategoryId,
      quantity: item.quantity,
    }));

    const breakdown = this.cvScoringService.calculateScoreFromItems(scoringItems, categories);

    await this.db
      .update(enrollments)
      .set({
        scoreDraft: String(breakdown.total.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId));
  }
}
