import { BillingModule } from '@/modules/billing/billing.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { forwardRef, Module } from '@nestjs/common'

import { AuditLogsModule } from '../audit-logs/audit-logs.module'
import { MembershipController } from './membership.controller'
import { MembershipRepository } from './membership.repository'
import { MembershipService } from './membership.service'

@Module({
  imports: [forwardRef(() => OrganizationModule), forwardRef(() => AuditLogsModule), BillingModule],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService]
})
export class MembershipModule {}
