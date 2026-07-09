import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ScoreAdjustmentSelect } from '../database/schema/score-adjustments';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { CreateScoreAdjustmentDto } from './dto/create-score-adjustment.dto';
import { ScoreAdjustmentRepository } from './infrastructure/persistence/score-adjustment.repository';

@Injectable()
export class ScoreAdjustmentService {
  constructor(
    private readonly scoreAdjustmentRepository: ScoreAdjustmentRepository,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async findByEnrollment(enrollmentId: string): Promise<ScoreAdjustmentSelect[]> {
    return this.scoreAdjustmentRepository.findByEnrollment(enrollmentId);
  }

  async create(
    userId: string,
    enrollmentId: string,
    dto: CreateScoreAdjustmentDto,
  ): Promise<ScoreAdjustmentSelect> {
    const enrollment = await this.enrollmentService.findById(enrollmentId);

    // 1. Check if there is an existing adjustment that is locked
    const existing = await this.scoreAdjustmentRepository.findByType(enrollmentId, dto.scoreType);
    if (existing && existing.isLocked) {
      throw new BadRequestException('Este ajuste está bloqueado e não pode ser modificado.');
    }

    // 2. Fetch original value
    let originalValue = 0;
    if (dto.scoreType === 'ira') {
      originalValue = enrollment.ira ? parseFloat(enrollment.ira) : 0;
    } else if (dto.scoreType === 'cv_score') {
      originalValue = enrollment.scoreValidated ? parseFloat(enrollment.scoreValidated) : 0;
    } else if (dto.scoreType === 'final') {
      originalValue = enrollment.scoreValidated ? parseFloat(enrollment.scoreValidated) : 0;
    }

    const adjustment = await this.scoreAdjustmentRepository.upsert({
      enrollmentId,
      adjustedBy: userId,
      scoreType: dto.scoreType,
      originalValue: String(originalValue.toFixed(2)),
      adjustedValue: String(dto.adjustedValue.toFixed(2)),
      justification: dto.justification,
      isLocked: false,
    });

    return adjustment;
  }

  async delete(enrollmentId: string, scoreType: 'cv_score' | 'ira' | 'final'): Promise<void> {
    const existing = await this.scoreAdjustmentRepository.findByType(enrollmentId, scoreType);
    if (!existing) {
      throw new NotFoundException('Ajuste não encontrado.');
    }
    if (existing.isLocked) {
      throw new BadRequestException('Este ajuste está bloqueado e não pode ser removido.');
    }
    await this.scoreAdjustmentRepository.delete(enrollmentId, scoreType);
  }

  async lockAll(enrollmentId: string): Promise<void> {
    await this.scoreAdjustmentRepository.lockAll(enrollmentId);
  }
}
