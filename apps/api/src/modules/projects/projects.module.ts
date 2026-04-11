import { Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectRepository } from './project.repository';

@Module({
  imports: [OrganizationModule, ClientsModule, AuditLogsModule, BillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
