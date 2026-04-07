import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '@/common/dto/pagination-meta-response.dto';
import { ClientResponseDto } from './client-response.dto';

export class ListClientsResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  items!: ClientResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMetaResponseDto;
}
