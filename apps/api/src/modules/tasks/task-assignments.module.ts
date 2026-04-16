import { Module } from '@nestjs/common'

import { TaskAssignmentService } from './task-assignment.service'
import { TaskRepository } from './task.repository'

@Module({
  providers: [TaskAssignmentService, TaskRepository],
  exports: [TaskAssignmentService, TaskRepository]
})
export class TaskAssignmentsModule {}
