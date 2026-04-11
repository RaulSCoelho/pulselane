import { ApiProperty } from '@nestjs/swagger'
import { EmailDeliveryStatus } from '@prisma/client'
import { type JsonValue } from '@prisma/client/runtime/library'

import { EmailDeliverySenderResponseDto } from './email-delivery-sender-response.dto'

export class EmailDeliveryResponseDto {
  @ApiProperty({ example: 'clxemail123' })
  id!: string

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string

  @ApiProperty({ example: 'clxuser123', nullable: true })
  sentBy!: string | null

  @ApiProperty({ example: 'invitee@example.com' })
  to!: string

  @ApiProperty({ example: 'Invitation to join Pulselane Labs on Pulselane' })
  subject!: string

  @ApiProperty({ example: 'logger' })
  transport!: string

  @ApiProperty({
    enum: EmailDeliveryStatus,
    example: EmailDeliveryStatus.sent
  })
  status!: EmailDeliveryStatus

  @ApiProperty({ example: null, nullable: true })
  error!: string | null

  @ApiProperty({
    example: {
      type: 'organization_invitation',
      organizationId: 'clxorg123',
      invitationId: 'clxinv123'
    },
    nullable: true
  })
  metadata!: JsonValue

  @ApiProperty({
    example: '2026-04-08T03:00:00.000Z',
    nullable: true
  })
  sentAt!: Date | null

  @ApiProperty({ example: '2026-04-08T03:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2026-04-08T03:00:00.000Z' })
  updatedAt!: Date

  @ApiProperty({
    type: EmailDeliverySenderResponseDto,
    nullable: true
  })
  sender!: EmailDeliverySenderResponseDto | null
}
