import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  universityId?: string;
}
