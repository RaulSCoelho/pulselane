import { ApiProperty } from '@nestjs/swagger'
import { BillingPlan, BillingSubscriptionStatus } from '@prisma/client'

export class OrganizationPlanResponseDto {
  @ApiProperty({ enum: BillingPlan, example: BillingPlan.free })
  plan!: BillingPlan

  @ApiProperty({ enum: BillingSubscriptionStatus, example: BillingSubscriptionStatus.free })
  status!: BillingSubscriptionStatus

  @ApiProperty({ example: null, nullable: true })
  currentPeriodEnd!: Date | null

  @ApiProperty({ example: false })
  cancelAtPeriodEnd!: boolean
}
