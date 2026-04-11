import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto'
import { ApiProperty } from '@nestjs/swagger'

import { InvitationResponseDto } from './invitation-response.dto'

export class ListInvitationsResponseDto {
  @ApiProperty({ type: [InvitationResponseDto] })
  items!: InvitationResponseDto[]

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto
}
