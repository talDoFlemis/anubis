import { Injectable, NotFoundException } from '@nestjs/common';
import type { CvScoringCategory } from './domain/cv-scoring-category';
import type { CreateCvScoringCategoryDto } from './dto/create-cv-scoring-category.dto';
import type { UpdateCvScoringCategoryDto } from './dto/update-cv-scoring-category.dto';
import { CvScoringCategoryRepository } from './infrastructure/persistence/cv-scoring-category.repository';

@Injectable()
export class CvScoringCategoryService {
  constructor(private readonly cvScoringCategoryRepository: CvScoringCategoryRepository) {}

  async create(periodId: string, dto: CreateCvScoringCategoryDto): Promise<CvScoringCategory> {
    return this.cvScoringCategoryRepository.create(periodId, dto);
  }

  async findByPeriodAndLevel(periodId: string, level: string): Promise<CvScoringCategory[]> {
    return this.cvScoringCategoryRepository.findByPeriodAndLevel(periodId, level);
  }

  async findAllByPeriod(periodId: string): Promise<CvScoringCategory[]> {
    return this.cvScoringCategoryRepository.findAllByPeriod(periodId);
  }

  async findById(id: string): Promise<CvScoringCategory> {
    const category = await this.cvScoringCategoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Categoria de pontuação não encontrada.');
    }

    return category;
  }

  async update(id: string, dto: UpdateCvScoringCategoryDto): Promise<CvScoringCategory> {
    await this.findById(id);
    return this.cvScoringCategoryRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.cvScoringCategoryRepository.remove(id);
  }

  async copyFromPeriod(
    sourcePeriodId: string,
    targetPeriodId: string,
  ): Promise<CvScoringCategory[]> {
    const result = await this.cvScoringCategoryRepository.copyFromPeriod(
      sourcePeriodId,
      targetPeriodId,
    );

    if (result.length === 0) {
      throw new NotFoundException('Nenhuma categoria encontrada no período de origem.');
    }

    return result;
  }
}
