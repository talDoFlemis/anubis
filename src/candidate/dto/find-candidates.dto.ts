import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { StatusEnum } from '../../statuses/statuses.enum';

function toTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function toLowerTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.toLowerCase().trim() : value;
}

function toDigitsOnlyString(value: unknown): unknown {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value;
}

function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return value;
}

function toOptionalNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
}

export class FindCandidatesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toLowerTrimmedString(value))
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toDigitsOnlyString(value))
  @IsString()
  @MaxLength(11)
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ enum: StatusEnum })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  onboardingCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MaxLength(255)
  universityOfOrigin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @Min(0)
  @Max(10)
  iraMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @Min(0)
  @Max(10)
  iraMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  poscompMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  poscompMax?: number;
}
