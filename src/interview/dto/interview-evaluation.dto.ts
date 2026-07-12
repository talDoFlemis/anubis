import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class InterviewEvaluationDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  decisionMaking!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  problemAnalysis!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  oralCommunication!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  researchWork!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  technicalKnowledge!: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
