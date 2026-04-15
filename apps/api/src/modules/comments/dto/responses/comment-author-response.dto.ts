import { ApiProperty } from '@nestjs/swagger'

export class CommentAuthorResponseDto {
  @ApiProperty({ example: 'clxuser123' })
  id!: string

  @ApiProperty({ example: 'Raul' })
  name!: string

  @ApiProperty({ example: 'raul@example.com' })
  email!: string
}
