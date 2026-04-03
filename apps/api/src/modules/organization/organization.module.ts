import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [MembershipModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
