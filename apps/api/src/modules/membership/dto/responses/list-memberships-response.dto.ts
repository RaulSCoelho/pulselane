import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '@/common/dto/pagination-meta-response.dto';
import { MembershipResponseDto } from './membership-response.dto';

export class ListMembershipsResponseDto {
  @ApiProperty({ type: [MembershipResponseDto] })
  items!: MembershipResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMetaResponseDto;
}
