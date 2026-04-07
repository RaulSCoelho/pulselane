import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '@/common/dto/pagination-meta-response.dto';
import { TaskResponseDto } from './task-response.dto';

export class ListTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  items!: TaskResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMetaResponseDto;
}
