import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MergeEntitiesDto {
  @ApiProperty({ description: 'ID of the target entity to merge into' })
  @IsUUID()
  targetId!: string;
}
