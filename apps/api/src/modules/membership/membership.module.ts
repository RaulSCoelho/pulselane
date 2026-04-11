import { forwardRef, Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { MembershipService } from './membership.service';
import { MembershipRepository } from './membership.repository';
import { MembershipController } from './membership.controller';

@Module({
  imports: [forwardRef(() => OrganizationModule), BillingModule],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService],
})
export class MembershipModule {}
