import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateEnrollmentPeriodDto {
  @ApiProperty({ example: 'Seleção 2026.1' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: '2026.1' })
  @IsNotEmpty()
  @IsString()
  semester!: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-02-15T23:59:59.000Z' })
  @IsDateString()
  endDate!: string;
}
