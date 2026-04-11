import { Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';

@Module({
  imports: [
    OrganizationModule,
    MembershipModule,
    ProjectsModule,
    AuditLogsModule,
    BillingModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
  exports: [TasksService],
})
export class TasksModule {}
