import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from './task-response.dto';

export class ListTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  items!: TaskResponseDto[];
}
