import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto'
import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class ListCommentActivityHistoryQueryDto extends CursorPaginationQueryDto {
  @ApiProperty({ example: 'clxtask123' })
  @IsString()
  taskId!: string
}
