import { BillingModule } from '@/modules/billing/billing.module'
import { TaskAssignmentsModule } from '@/modules/tasks/task-assignments.module'
import { Module } from '@nestjs/common'

import { AuditLogsModule } from '../audit-logs/audit-logs.module'
import { MembershipController } from './membership.controller'
import { MembershipRepository } from './membership.repository'
import { MembershipService } from './membership.service'

@Module({
  imports: [AuditLogsModule, BillingModule, TaskAssignmentsModule],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService]
})
export class MembershipModule {}
