import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import type { ResearchThemeReference } from '@/common/types/research-theme-reference';
import { ApiProperty } from '@nestjs/swagger';
import { ResearchThemeLevelEnum } from '../research-theme-level.enum';

export class ResearchThemeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ format: 'uuid' })
  professorId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  vacancies: number;

  @ApiProperty({ enum: ResearchThemeLevelEnum })
  level: ResearchThemeLevelEnum;

  @ApiProperty({ type: Object, isArray: true })
  references: ResearchThemeReference[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedResearchThemeResponseDto extends PaginatedResponseDto<ResearchThemeResponseDto> {
  @ApiProperty({ type: ResearchThemeResponseDto, isArray: true })
  declare data: ResearchThemeResponseDto[];
}
