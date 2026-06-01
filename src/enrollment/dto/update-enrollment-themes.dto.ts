import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateEnrollmentThemesDto {
  @ApiProperty()
  @IsUUID()
  primaryThemeId!: string;

  @ApiProperty()
  @IsUUID()
  secondaryThemeId!: string;
}
