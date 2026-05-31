import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CopyScoringCategoriesDto {
  @ApiProperty({ description: 'ID do período de origem' })
  @IsUUID()
  sourcePeriodId: string;
}
