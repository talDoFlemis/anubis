import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class PoscompDto {
  @ApiProperty()
  @IsBoolean()
  hasPoscomp!: boolean;

  @ApiPropertyOptional()
  @ValidateIf(o => o.hasPoscomp)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @ValidateIf(o => o.hasPoscomp)
  @IsNumber()
  mathScore?: number;

  @ApiPropertyOptional()
  @ValidateIf(o => o.hasPoscomp)
  @IsNumber()
  fundamentalsScore?: number;

  @ApiPropertyOptional()
  @ValidateIf(o => o.hasPoscomp)
  @IsNumber()
  technologyScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptFileId?: string;
}
