import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EnrollmentLevel } from '../../enrollment/dto/enrollment-level.enum';

export class CreateCvScoringCategoryDto {
  @ApiProperty({ example: 'Projetos de pesquisa e IC' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  @Min(0)
  pointsPerItem: number;

  @ApiProperty({ example: 2.0 })
  @IsNumber()
  @Min(0)
  maxPoints: number;

  @ApiProperty({ enum: EnrollmentLevel })
  @IsEnum(EnrollmentLevel)
  level: EnrollmentLevel;


  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
