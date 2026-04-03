import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectRepository } from './project.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [MembershipModule, ClientsModule, AuditLogsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
