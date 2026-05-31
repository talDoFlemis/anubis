import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
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
}

export class UpdateMastersDegreesDto {
  @ApiProperty({ type: [MastersDegreeDto] })
  @ValidateNested({ each: true })
  @Type(() => MastersDegreeDto)
  @ArrayMinSize(1)
  mastersDegrees!: MastersDegreeDto[];
}
