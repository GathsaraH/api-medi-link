import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPrevPage: boolean;

  @ApiProperty()
  startIndex: number;

  @ApiProperty()
  endIndex: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  pagination: PaginationMetaDto;

  @ApiProperty()
  generatedAt: Date;
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalCount: number,
): PaginatedResponseDto<T> {
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(startIndex + data.length - 1, totalCount);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      startIndex: totalCount > 0 ? startIndex : 0,
      endIndex: totalCount > 0 ? endIndex : 0,
    },
    generatedAt: new Date(),
  };
}
