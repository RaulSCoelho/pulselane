import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectRepository } from './project.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    MembershipModule,
    OrganizationModule,
    ClientsModule,
    AuditLogsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
