import { Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientRepository } from './client.repository';

@Module({
  imports: [OrganizationModule, AuditLogsModule, BillingModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientRepository],
  exports: [ClientsService],
})
export class ClientsModule {}
