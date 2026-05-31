import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UniversityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: '"name (abbreviation)" or just "name"' })
  label!: string;
}

export class UniversityDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  abbreviation!: string | null;

  @ApiPropertyOptional()
  state!: string | null;

  @ApiPropertyOptional()
  city!: string | null;

  @ApiProperty()
  isManual!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
