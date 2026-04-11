import { ApiProperty } from '@nestjs/swagger'

export class TaskProjectResponseDto {
  @ApiProperty({ example: 'clxproject123' })
  id!: string

  @ApiProperty({ example: 'Website Redesign' })
  name!: string
}
