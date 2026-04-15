import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto'
import { ApiProperty } from '@nestjs/swagger'

import { CommentActivityHistoryItemResponseDto } from './comment-activity-history-item-response.dto'

export class ListCommentActivityHistoryResponseDto {
  @ApiProperty({ type: [CommentActivityHistoryItemResponseDto] })
  items!: CommentActivityHistoryItemResponseDto[]

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto
}
