import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Course name' })
  label: string;
}

export class CourseDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  universityId: string | null;

  @ApiProperty()
  isManual: boolean;

  @ApiProperty()
  createdAt: Date;
}
