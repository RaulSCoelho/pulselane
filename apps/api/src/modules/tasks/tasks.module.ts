import { Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [
    MembershipModule,
    OrganizationModule,
    ProjectsModule,
    AuditLogsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
})
export class TasksModule {}
