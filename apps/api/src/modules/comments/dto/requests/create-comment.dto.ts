import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateCommentDto {
  @ApiProperty({ example: 'clxtask123' })
  @IsString()
  taskId!: string

  @ApiProperty({ example: 'Need client confirmation before moving this task forward.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value) as unknown)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string
}
