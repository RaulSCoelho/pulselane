import { ApiProperty } from '@nestjs/swagger'
import { BillingPlan, BillingSubscriptionStatus } from '@prisma/client'

import { BillingPlanActionType, BillingPlanChangeKind } from '../../billing-plan-catalog'

class BillingPlanLimitsDto {
  @ApiProperty({ example: 3, nullable: true })
  members!: number | null

  @ApiProperty({ example: 10, nullable: true })
  clients!: number | null

  @ApiProperty({ example: 10, nullable: true })
  projects!: number | null

  @ApiProperty({ example: 100, nullable: true })
  active_tasks!: number | null
}

class BillingPlanCatalogItemDto {
  @ApiProperty({ enum: BillingPlan, example: BillingPlan.starter })
  plan!: BillingPlan

  @ApiProperty({ example: 'Starter' })
  displayName!: string

  @ApiProperty({ example: 'Paid plan for growing teams that already need real operational capacity.' })
  description!: string

  @ApiProperty({ example: 2900 })
  monthlyPriceCents!: number

  @ApiProperty({ example: 'USD' })
  currency!: string

  @ApiProperty({ example: 'month' })
  billingInterval!: string

  @ApiProperty({ example: false })
  isFree!: boolean

  @ApiProperty({ example: false })
  isCurrent!: boolean

  @ApiProperty({ enum: BillingPlanActionType, example: BillingPlanActionType.checkout })
  action!: BillingPlanActionType

  @ApiProperty({ enum: BillingPlanChangeKind, example: BillingPlanChangeKind.upgrade })
  changeKind!: BillingPlanChangeKind

  @ApiProperty({ type: BillingPlanLimitsDto })
  limits!: BillingPlanLimitsDto
}

class CurrentOrganizationBillingDto {
  @ApiProperty({ enum: BillingPlan, example: BillingPlan.free })
  plan!: BillingPlan

  @ApiProperty({ enum: BillingSubscriptionStatus, example: BillingSubscriptionStatus.free })
  status!: BillingSubscriptionStatus

  @ApiProperty({ example: false })
  cancelAtPeriodEnd!: boolean

  @ApiProperty({
    example: '2026-04-30T00:00:00.000Z',
    nullable: true
  })
  currentPeriodEnd!: Date | null

  @ApiProperty({ example: false })
  stripeCustomerConfigured!: boolean

  @ApiProperty({ example: false })
  stripeSubscriptionConfigured!: boolean
}

export class BillingPlansResponseDto {
  @ApiProperty({ type: CurrentOrganizationBillingDto })
  current!: CurrentOrganizationBillingDto

  @ApiProperty({
    type: BillingPlanCatalogItemDto,
    isArray: true
  })
  plans!: BillingPlanCatalogItemDto[]
}
