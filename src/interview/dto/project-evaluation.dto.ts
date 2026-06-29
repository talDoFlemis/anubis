import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ConceptEnum {
  FRACO = 'FRACO',
  REGULAR = 'REGULAR',
  BOM = 'BOM',
  OTIMO = 'OTIMO',
}

export class ProjectEvaluationDto {
  @IsEnum(ConceptEnum)
  criterion1!: ConceptEnum;

  @IsEnum(ConceptEnum)
  criterion2!: ConceptEnum;

  @IsEnum(ConceptEnum)
  criterion3!: ConceptEnum;

  @IsEnum(ConceptEnum)
  criterion4!: ConceptEnum;

  @IsEnum(ConceptEnum)
  criterion5!: ConceptEnum;

  @IsOptional()
  @IsString()
  observations?: string;
}
