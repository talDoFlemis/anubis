import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateEnrollmentThemesDto {
  @ApiProperty()
  @IsUUID()
  primaryThemeId!: string;

  @ApiPropertyOptional({
    description: 'Tema secundário. Omitir/null quando o candidato não deseja informar.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  secondaryThemeId?: string | null;
}
