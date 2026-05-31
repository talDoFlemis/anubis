import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CvScoringCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentPeriodId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  pointsPerItem: string;

  @ApiProperty()
  maxPoints: string;

  @ApiProperty()
  level: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
