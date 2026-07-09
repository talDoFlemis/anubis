import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class SetEntityStatusDto {
  @ApiProperty({ enum: ['approved', 'invalidated'] })
  @IsEnum(['approved', 'invalidated'])
  status!: 'approved' | 'invalidated';
}
