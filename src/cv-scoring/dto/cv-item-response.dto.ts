import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CvItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  scoringCategoryId: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  proofFileId: string | null;

  @ApiPropertyOptional()
  proofFileName: string | null;

  @ApiPropertyOptional()
  score: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
