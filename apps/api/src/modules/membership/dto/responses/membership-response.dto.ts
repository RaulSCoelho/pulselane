import { ApiProperty } from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'

import { MembershipOrganizationResponseDto } from './membership-organization-response.dto'
import { MembershipUserResponseDto } from './membership-user-response.dto'

export class MembershipResponseDto {
  @ApiProperty({ example: 'clxmembership123' })
  id!: string

  @ApiProperty({ example: 'clxuser123' })
  userId!: string

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.member })
  role!: MembershipRole

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ type: MembershipUserResponseDto })
  user!: MembershipUserResponseDto

  @ApiProperty({ type: MembershipOrganizationResponseDto })
  organization!: MembershipOrganizationResponseDto
}
