import { ApiProperty } from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'

import { OrganizationLimitsResponseDto } from './organization-limits-response.dto'
import { OrganizationPlanResponseDto } from './organization-plan-response.dto'
import { OrganizationResponseDto } from './organization-response.dto'
import { OrganizationUsageResponseDto } from './organization-usage-response.dto'

export class CurrentOrganizationResponseDto {
  @ApiProperty({ type: OrganizationResponseDto })
  organization!: OrganizationResponseDto

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.owner })
  currentRole!: MembershipRole

  @ApiProperty({ type: OrganizationPlanResponseDto })
  plan!: OrganizationPlanResponseDto

  @ApiProperty({ type: OrganizationLimitsResponseDto })
  limits!: OrganizationLimitsResponseDto

  @ApiProperty({ type: OrganizationUsageResponseDto })
  usage!: OrganizationUsageResponseDto
}
