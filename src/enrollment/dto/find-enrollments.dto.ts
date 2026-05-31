import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindEnrollmentsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  enrollmentPeriodId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'submitted', 'closed'] })
  @IsOptional()
  @IsEnum(['draft', 'submitted', 'closed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['masters', 'doctoral'] })
  @IsOptional()
  @IsEnum(['masters', 'doctoral'])
  level?: string;
}
