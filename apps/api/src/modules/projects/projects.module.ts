import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { ClientsModule } from '@/modules/clients/clients.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { Module } from '@nestjs/common'

import { ProjectRepository } from './project.repository'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'

@Module({
  imports: [OrganizationModule, ClientsModule, AuditLogsModule, BillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository],
  exports: [ProjectsService]
})
export class ProjectsModule {}
