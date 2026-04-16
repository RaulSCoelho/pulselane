import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { Module } from '@nestjs/common'

import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from './organization.repository'
import { OrganizationService } from './organization.service'

@Module({
  imports: [MembershipModule, BillingModule, AuditLogsModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService]
})
export class OrganizationModule {}
