import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class VerifyCvItemDto {
  @ApiProperty({ enum: ['verified', 'incorrect'] })
  @IsEnum(['verified', 'incorrect'])
  isVerified!: 'verified' | 'incorrect';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctedClassification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationComment?: string;
}
