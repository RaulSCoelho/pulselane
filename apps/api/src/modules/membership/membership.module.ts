import { BillingModule } from '@/modules/billing/billing.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { forwardRef, Module } from '@nestjs/common'

import { MembershipController } from './membership.controller'
import { MembershipRepository } from './membership.repository'
import { MembershipService } from './membership.service'

@Module({
  imports: [forwardRef(() => OrganizationModule), BillingModule],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService]
})
export class MembershipModule {}
