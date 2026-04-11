import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto'
import { ApiProperty } from '@nestjs/swagger'

import { TaskResponseDto } from './task-response.dto'

export class ListTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  items!: TaskResponseDto[]

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto
}
