import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { ProjectsModule } from '@/modules/projects/projects.module'
import { Module } from '@nestjs/common'

import { TaskAssignmentsModule } from './task-assignments.module'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

@Module({
  imports: [MembershipModule, ProjectsModule, AuditLogsModule, BillingModule, TaskAssignmentsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService]
})
export class TasksModule {}
