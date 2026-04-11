import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto'
import { ApiProperty } from '@nestjs/swagger'

import { ClientResponseDto } from './client-response.dto'

export class ListClientsResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  items!: ClientResponseDto[]

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto
}
