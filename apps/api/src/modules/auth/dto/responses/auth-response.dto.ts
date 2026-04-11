import { ApiProperty } from '@nestjs/swagger'

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (short-lived)'
  })
  accessToken!: string

  @ApiProperty({
    example: 900,
    description: 'Access token expiration in seconds'
  })
  expiresIn!: number
}
