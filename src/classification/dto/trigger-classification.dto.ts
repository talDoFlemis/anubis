import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum StageEnum {
  MESTRADO = 'mestrado',
  DOUTORADO = 'doutorado',
}

export class TriggerClassificationDto {
  @IsOptional()
  @IsUUID()
  researchThemeId?: string;

  @IsOptional()
  @IsEnum(StageEnum)
  stage?: 'mestrado' | 'doutorado';
}
