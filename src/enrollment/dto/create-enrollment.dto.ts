import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { EnrollmentLevel } from './enrollment-level.enum';

export class CreateEnrollmentDto {
  @ApiProperty({ enum: EnrollmentLevel })
  @IsEnum(EnrollmentLevel)
  level: EnrollmentLevel;

  @ApiProperty()
  @IsUUID()
  enrollmentPeriodId: string;
}
