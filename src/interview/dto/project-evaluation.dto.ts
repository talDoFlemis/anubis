import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProjectEvaluationDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  criterion1!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterion2!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterion3!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterion4!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterion5!: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
