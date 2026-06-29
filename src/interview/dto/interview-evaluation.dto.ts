import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ConceptEnum {
  FRACO = 'FRACO',
  REGULAR = 'REGULAR',
  BOM = 'BOM',
  OTIMO = 'OTIMO',
}

export class InterviewEvaluationDto {
  @IsEnum(ConceptEnum)
  decisionMaking!: ConceptEnum;

  @IsEnum(ConceptEnum)
  problemAnalysis!: ConceptEnum;

  @IsEnum(ConceptEnum)
  oralCommunication!: ConceptEnum;

  @IsEnum(ConceptEnum)
  researchWork!: ConceptEnum;

  @IsEnum(ConceptEnum)
  technicalKnowledge!: ConceptEnum;

  @IsOptional()
  @IsString()
  observations?: string;
}
