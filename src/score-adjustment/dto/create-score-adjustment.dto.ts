import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateScoreAdjustmentDto {
  @ApiProperty({ enum: ['cv_score', 'ira', 'final'] })
  @IsEnum(['cv_score', 'ira', 'final'])
  scoreType!: 'cv_score' | 'ira' | 'final';

  @ApiProperty()
  @IsNumber()
  adjustedValue!: number;

  @ApiProperty()
  @IsString()
  @MinLength(10, { message: 'A justificativa deve ter pelo menos 10 caracteres.' })
  justification!: string;
}
