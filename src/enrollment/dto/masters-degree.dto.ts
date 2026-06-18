import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MastersDegreeDto {
  @ApiProperty({ example: 'Universidade Federal do Ceará' })
  @IsNotEmpty()
  @IsString()
  university!: string;

  @ApiProperty({ example: 'Ciência da Computação' })
  @IsNotEmpty()
  @IsString()
  graduateProgram!: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  ira!: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  isPrimary!: boolean;

  @ApiPropertyOptional({
    description: 'ID do comprovante do IRA do mestrado (enviado via upload).',
  })
  @IsOptional()
  @IsString()
  proofFileId?: string;
}

export class UpdateMastersDegreesDto {
  @ApiProperty({ type: [MastersDegreeDto] })
  @ValidateNested({ each: true })
  @Type(() => MastersDegreeDto)
  @ArrayMinSize(1)
  mastersDegrees!: MastersDegreeDto[];
}
