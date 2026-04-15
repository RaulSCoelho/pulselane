import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto'
import { ApiProperty } from '@nestjs/swagger'

import { CommentResponseDto } from './comment-response.dto'

export class ListCommentsResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items!: CommentResponseDto[]

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto
}
