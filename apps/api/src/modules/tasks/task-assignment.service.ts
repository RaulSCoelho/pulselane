import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { TaskRepository } from './task.repository'

@Injectable()
export class TaskAssignmentService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async unassignAllByUser(organizationId: string, userId: string, tx?: Prisma.TransactionClient) {
    return this.taskRepository.unassignAllByAssignee(organizationId, userId, tx)
  }
}
