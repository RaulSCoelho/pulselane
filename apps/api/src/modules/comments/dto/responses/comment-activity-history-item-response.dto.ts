import { ApiProperty } from '@nestjs/swagger'

import { CommentAuthorResponseDto } from './comment-author-response.dto'

export class CommentActivityHistoryItemResponseDto {
  @ApiProperty({ example: 'clxcomment123' })
  id!: string

  @ApiProperty({ example: 'comment', enum: ['comment', 'audit_log'] })
  source!: 'comment' | 'audit_log'

  @ApiProperty({ example: 'comment_created' })
  action!: string

  @ApiProperty({ example: 'task' })
  entityType!: string

  @ApiProperty({ example: 'clxtask123' })
  entityId!: string

  @ApiProperty({ example: 'clxtask123' })
  taskId!: string

  @ApiProperty({ example: 'Need client confirmation before moving this task forward.', nullable: true })
  content!: string | null

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  occurredAt!: Date

  @ApiProperty({ example: null, nullable: true })
  deletedAt!: Date | null

  @ApiProperty({ example: null, nullable: true })
  metadata!: Record<string, unknown> | null

  @ApiProperty({ type: CommentAuthorResponseDto, nullable: true })
  actor!: CommentAuthorResponseDto | null
}
