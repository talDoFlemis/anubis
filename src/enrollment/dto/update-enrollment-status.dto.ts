import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum EnrollmentStatusUpdate {
  Submitted = 'submitted',
  Closed = 'closed',
}

export class UpdateEnrollmentStatusDto {
  @ApiProperty({ enum: EnrollmentStatusUpdate })
  @IsEnum(EnrollmentStatusUpdate)
  status!: EnrollmentStatusUpdate;
}
