import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module'
import { MembershipModule } from '@/modules/membership/membership.module'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { TasksModule } from '@/modules/tasks/tasks.module'
import { Module } from '@nestjs/common'

import { CommentRepository } from './comment.repository'
import { CommentsController } from './comments.controller'
import { CommentsService } from './comments.service'

@Module({
  imports: [OrganizationModule, MembershipModule, TasksModule, AuditLogsModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository],
  exports: [CommentsService]
})
export class CommentsModule {}
