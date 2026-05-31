import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreateCvItemDto } from './dto/create-cv-item.dto';
import type { UpdateCvItemDto } from './dto/update-cv-item.dto';

import { FileStorageService } from '../file-storage/file-storage.service';
import { CvScoringService } from './cv-scoring.service';
import { CvItem } from './domain/cv-item';
import { CvItemRepository } from './infrastructure/persistence/cv-item.repository';

@Injectable()
export class CvItemService {
  constructor(
    private readonly cvItemRepository: CvItemRepository,
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

    const item = await this.cvItemRepository.create({
      enrollmentId,
      scoringCategoryId: dto.scoringCategoryId,
      description: dto.description,
      quantity: dto.quantity ?? 1,
      proofFileId,
    });

    await this.recalculateScore(enrollmentId);
    return item;
  }

  async findByEnrollment(enrollmentId: string): Promise<CvItem[]> {
    return this.cvItemRepository.findByEnrollment(enrollmentId);
  }

  async findById(enrollmentId: string, itemId: string): Promise<CvItem> {
    const item = await this.cvItemRepository.findById(itemId);

    if (!item || item.enrollmentId !== enrollmentId) {
      throw new NotFoundException('Item do CV não encontrado.');
    }

    return item;
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

    const item = await this.cvItemRepository.update(itemId, updateData as any);

    await this.recalculateScore(enrollmentId);
    return item;
  }

  async remove(userId: string, enrollmentId: string, itemId: string): Promise<void> {
    await this.getAndValidateEnrollment(enrollmentId, userId);
    const item = await this.findById(enrollmentId, itemId);

    if (item.proofFileId) {
      await this.fileStorageService.delete(item.proofFileId);
    }

    await this.cvItemRepository.remove(itemId);
    await this.recalculateScore(enrollmentId);
  }

  private async getEnrollment(enrollmentId: string) {
    const enrollment = await this.cvItemRepository.findEnrollmentById(enrollmentId);

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
    const category = await this.cvItemRepository.findScoringCategoryById(categoryId);

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

    await this.cvItemRepository.updateEnrollmentScore(
      enrollmentId,
      String(breakdown.total.toFixed(2)),
    );
  }
}
