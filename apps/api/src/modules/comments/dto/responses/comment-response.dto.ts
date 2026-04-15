import { ApiProperty } from '@nestjs/swagger'

import { CommentAuthorResponseDto } from './comment-author-response.dto'

export class CommentResponseDto {
  @ApiProperty({ example: 'clxcomment123' })
  id!: string

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string

  @ApiProperty({ example: 'clxtask123' })
  taskId!: string

  @ApiProperty({ example: 'clxuser123' })
  authorUserId!: string

  @ApiProperty({ example: 'Need client confirmation before moving this task forward.' })
  body!: string

  @ApiProperty({ example: null, nullable: true })
  deletedAt!: Date | null

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  updatedAt!: Date

  @ApiProperty({ type: CommentAuthorResponseDto })
  author!: CommentAuthorResponseDto
}
