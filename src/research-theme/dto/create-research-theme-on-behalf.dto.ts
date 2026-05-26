import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateResearchThemeDto } from './create-research-theme.dto';

export class CreateResearchThemeOnBehalfDto extends CreateResearchThemeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professorId: string;
}
