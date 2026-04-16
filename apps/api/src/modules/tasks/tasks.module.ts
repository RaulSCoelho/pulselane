import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { ProjectsModule } from '@/modules/projects/projects.module'
import { forwardRef, Module } from '@nestjs/common'

import { TaskAssignmentService } from './task-assignment.service'
import { TaskRepository } from './task.repository'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

@Module({
  imports: [
    forwardRef(() => OrganizationModule),
    forwardRef(() => MembershipModule),
    ProjectsModule,
    forwardRef(() => AuditLogsModule),
    BillingModule
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskAssignmentService, TaskRepository],
  exports: [TasksService, TaskAssignmentService]
})
export class TasksModule {}
