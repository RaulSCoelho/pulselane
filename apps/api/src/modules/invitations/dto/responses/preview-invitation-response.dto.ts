import { ApiProperty } from '@nestjs/swagger'
import { MembershipRole, OrganizationInvitationStatus } from '@prisma/client'

export class PreviewInvitationResponseDto {
  @ApiProperty({ example: 'clxinv123' })
  id!: string

  @ApiProperty({ example: 'invitee@example.com' })
  email!: string

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.member })
  role!: MembershipRole

  @ApiProperty({
    enum: OrganizationInvitationStatus,
    example: OrganizationInvitationStatus.pending
  })
  status!: OrganizationInvitationStatus

  @ApiProperty({ example: 'Pulselane Labs' })
  organizationName!: string

  @ApiProperty({ example: 'pulselane-labs' })
  organizationSlug!: string

  @ApiProperty({ example: 'Raul Semicek' })
  invitedByName!: string

  @ApiProperty({ example: '2026-04-30T12:00:00.000Z' })
  expiresAt!: Date

  @ApiProperty({ example: false })
  isExpired!: boolean

  @ApiProperty({ example: true })
  canAccept!: boolean
}
