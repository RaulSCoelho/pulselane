import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { forwardRef, Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { OrganizationContextGuard } from './guards/organization-context.guard'
import { OrganizationRolesGuard } from './guards/organization-roles.guard'
import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from './organization.repository'
import { OrganizationService } from './organization.service'

@Module({
  imports: [forwardRef(() => MembershipModule), BillingModule, forwardRef(() => AuditLogsModule)],
  controllers: [OrganizationController],
  providers: [Reflector, OrganizationService, OrganizationRepository, OrganizationContextGuard, OrganizationRolesGuard],
  exports: [OrganizationService, OrganizationContextGuard, OrganizationRolesGuard]
})
export class OrganizationModule {}
