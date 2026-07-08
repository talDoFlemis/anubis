import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ResearchThemeLevelEnum } from '@/research-theme/research-theme-level.enum';

function toTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class FindResearchThemesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ResearchThemeLevelEnum })
  @IsOptional()
  @IsEnum(ResearchThemeLevelEnum)
  level?: ResearchThemeLevelEnum;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  professorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  search?: string;
}
