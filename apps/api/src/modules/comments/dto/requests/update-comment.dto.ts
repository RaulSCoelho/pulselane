import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class UpdateCommentDto {
  @ApiProperty({ example: 'Client confirmed. Proceeding with implementation.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value) as unknown)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string
}
