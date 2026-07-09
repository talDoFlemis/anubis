import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class SetUniversityGradeDto {
  @ApiProperty({ description: 'MEC Grade (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  mecGrade!: number;
}
