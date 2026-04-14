import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsDateString } from 'class-validator'

import { CreateTaskDto } from './create-task.dto'

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({
    example: '2026-04-14T12:00:00.000Z',
    description: 'Last known updatedAt value used for optimistic concurrency control'
  })
  @IsDateString()
  expectedUpdatedAt!: string
}
