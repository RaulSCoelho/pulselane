import { ApiProperty } from '@nestjs/swagger'

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number

  @ApiProperty({ example: 'Bad Request' })
  error!: string

  @ApiProperty({ example: 'Validation failed' })
  message!: string | string[]

  @ApiProperty({ example: '/api/clients' })
  path!: string

  @ApiProperty({ example: '2026-04-03T16:00:00.000Z' })
  timestamp!: string
}
