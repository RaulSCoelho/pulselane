import { Module } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { UsagePolicyService } from './usage-policy.service';

@Module({
  providers: [BillingRepository, BillingService, UsagePolicyService],
  exports: [BillingService, UsagePolicyService],
})
export class BillingModule {}
