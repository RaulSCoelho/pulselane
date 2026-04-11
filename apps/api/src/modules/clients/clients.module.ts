import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { Module } from '@nestjs/common'

import { ClientRepository } from './client.repository'
import { ClientsController } from './clients.controller'
import { ClientsService } from './clients.service'

@Module({
  imports: [OrganizationModule, AuditLogsModule, BillingModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientRepository],
  exports: [ClientsService]
})
export class ClientsModule {}
