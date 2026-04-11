import { ApiProperty } from '@nestjs/swagger'

export class AuditLogActorResponseDto {
  @ApiProperty({ example: 'clxuser123' })
  id!: string

  @ApiProperty({ example: 'Raul Semicek' })
  name!: string

  @ApiProperty({ example: 'raul@example.com' })
  email!: string
}
