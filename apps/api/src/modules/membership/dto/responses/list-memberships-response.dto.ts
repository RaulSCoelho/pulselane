import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto'
import { ApiProperty } from '@nestjs/swagger'

import { MembershipResponseDto } from './membership-response.dto'

export class ListMembershipsResponseDto {
  @ApiProperty({ type: [MembershipResponseDto] })
  items!: MembershipResponseDto[]

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto
}
