import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';
import { OrganizationController } from './organization.controller';
import { OrganizationContextGuard } from './guards/organization-context.guard';

@Module({
  imports: [MembershipModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    OrganizationRepository,
    OrganizationContextGuard,
  ],
  exports: [OrganizationService, OrganizationContextGuard],
})
export class OrganizationModule {}
