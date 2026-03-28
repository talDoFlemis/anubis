import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetaDto;
}

export function buildPaginatedResult<T>(params: {
  data: T[];
  page: number;
  limit: number;
  total: number;
}): PaginatedResult<T> {
  const totalPages =
    params.total === 0 ? 0 : Math.ceil(params.total / params.limit);

  return {
    data: params.data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total: params.total,
      totalPages,
    },
  };
}
