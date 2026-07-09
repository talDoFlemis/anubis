import { ApiProperty } from '@nestjs/swagger';

export class ScoreAdjustmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() enrollmentId!: string;
  @ApiProperty() adjustedBy!: string;
  @ApiProperty({ enum: ['cv_score', 'ira', 'final'] }) scoreType!: 'cv_score' | 'ira' | 'final';
  @ApiProperty() originalValue!: string;
  @ApiProperty() adjustedValue!: string;
  @ApiProperty() justification!: string;
  @ApiProperty() isLocked!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
