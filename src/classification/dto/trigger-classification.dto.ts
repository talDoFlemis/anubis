import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum StageEnum {
  MESTRADO = 'mestrado',
  DOUTORADO = 'doutorado',
}

export class TriggerClassificationDto {
  @IsOptional()
  @IsString()
  researchThemeId?: string;

  @IsOptional()
  @IsEnum(StageEnum)
  stage?: 'mestrado' | 'doutorado';
}
