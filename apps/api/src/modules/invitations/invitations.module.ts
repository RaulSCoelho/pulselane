import { Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { MembershipModule } from '@/modules/membership/membership.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { UserModule } from '@/modules/user/user.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationRepository } from './invitation.repository';

@Module({
  imports: [OrganizationModule, MembershipModule, AuditLogsModule, UserModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationRepository],
})
export class InvitationsModule {}
