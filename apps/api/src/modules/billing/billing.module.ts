import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { Module } from '@nestjs/common'

import { BillingController } from './billing.controller'
import { BillingRepository } from './billing.repository'
import { BillingService } from './billing.service'
import { StripeBillingService } from './stripe-billing.service'
import { UsagePolicyService } from './usage-policy.service'

@Module({
  imports: [AuditLogsModule],
  controllers: [BillingController],
  providers: [BillingRepository, BillingService, UsagePolicyService, StripeBillingService],
  exports: [BillingService, UsagePolicyService]
})
export class BillingModule {}
