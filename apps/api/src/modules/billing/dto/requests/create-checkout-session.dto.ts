import { ApiProperty } from '@nestjs/swagger'
import { BillingPlan } from '@prisma/client'
import { IsEnum } from 'class-validator'

export class CreateCheckoutSessionDto {
  @ApiProperty({
    enum: BillingPlan,
    example: BillingPlan.starter
  })
  @IsEnum(BillingPlan)
  plan!: BillingPlan
}
