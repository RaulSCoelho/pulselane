import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { EmailModule } from '@/modules/email/email.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { UserModule } from '@/modules/user/user.module'
import { Module } from '@nestjs/common'

import { BillingModule } from '../billing/billing.module'
import { InvitationLinksService } from './infra/invitation-links.service'
import { InvitationRepository } from './invitation.repository'
import { InvitationsController } from './invitations.controller'
import { InvitationsService } from './invitations.service'

@Module({
  imports: [OrganizationModule, MembershipModule, BillingModule, AuditLogsModule, UserModule, EmailModule.register()],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationRepository, InvitationLinksService]
})
export class InvitationsModule {}
