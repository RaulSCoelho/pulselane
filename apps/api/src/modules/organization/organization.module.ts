import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipModule } from '@/modules/membership/membership.module';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';
import { OrganizationController } from './organization.controller';
import { OrganizationContextGuard } from './guards/organization-context.guard';
import { OrganizationRolesGuard } from './guards/organization-roles.guard';

@Module({
  imports: [MembershipModule],
  controllers: [OrganizationController],
  providers: [
    Reflector,
    OrganizationService,
    OrganizationRepository,
    OrganizationContextGuard,
    OrganizationRolesGuard,
  ],
  exports: [
    OrganizationService,
    OrganizationContextGuard,
    OrganizationRolesGuard,
  ],
})
export class OrganizationModule {}
