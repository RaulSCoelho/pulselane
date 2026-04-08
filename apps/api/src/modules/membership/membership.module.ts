import { forwardRef, Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipRepository } from './membership.repository';
import { MembershipController } from './membership.controller';
import { OrganizationModule } from '@/modules/organization/organization.module';

@Module({
  imports: [forwardRef(() => OrganizationModule)],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService],
})
export class MembershipModule {}
