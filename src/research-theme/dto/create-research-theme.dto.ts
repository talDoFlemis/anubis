import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ResearchThemeLevelEnum } from '../research-theme-level.enum';
import { ResearchThemeReferenceDto } from './research-theme-reference.dto';

export class CreateResearchThemeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  vacancies!: number;

  @ApiProperty({ enum: ResearchThemeLevelEnum })
  @IsEnum(ResearchThemeLevelEnum)
  level!: ResearchThemeLevelEnum;

  @ApiPropertyOptional({ type: ResearchThemeReferenceDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ResearchThemeReferenceDto)
  references?: ResearchThemeReferenceDto[];

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  associatedProfessorIds?: string[];
}
