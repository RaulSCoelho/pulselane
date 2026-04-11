import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AcceptInvitationDto {
  @ApiProperty({ example: '5cc8d2d3a3e7415c9f0f6f2a8f6b2c11' })
  @IsString()
  token!: string
}
