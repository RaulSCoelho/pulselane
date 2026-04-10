import { ApiProperty } from '@nestjs/swagger';
import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto';
import { ProjectResponseDto } from './project-response.dto';

export class ListProjectsResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  items!: ProjectResponseDto[];

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto;
}
