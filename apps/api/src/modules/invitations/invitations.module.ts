import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { EmailModule } from '@/modules/email/email.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { UserModule } from '@/modules/user/user.module'
import { Module } from '@nestjs/common'

import { InvitationLinksService } from './infra/invitation-links.service'
import { InvitationRepository } from './invitation.repository'
import { InvitationsController } from './invitations.controller'
import { InvitationsService } from './invitations.service'

@Module({
  imports: [OrganizationModule, MembershipModule, AuditLogsModule, UserModule, EmailModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationRepository, InvitationLinksService]
})
export class InvitationsModule {}
