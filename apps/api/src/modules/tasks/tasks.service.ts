import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { UsagePolicyService } from '@/modules/billing/usage-policy.service'
import { MembershipService } from '@/modules/membership/membership.service'
import { ProjectsService } from '@/modules/projects/projects.service'
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogAction, Prisma, ProjectStatus, Task, TaskPriority, TaskStatus } from '@prisma/client'

import { CreateTaskDto } from './dto/requests/create-task.dto'
import { ListTasksQueryDto } from './dto/requests/list-tasks-query.dto'
import { UpdateTaskDto } from './dto/requests/update-task.dto'
import { TaskRepository } from './task.repository'

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskRepository: TaskRepository,
    private readonly membershipService: MembershipService,
    private readonly projectsService: ProjectsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly usagePolicyService: UsagePolicyService
  ) {}

  async create(actorUserId: string, organizationId: string, dto: CreateTaskDto, tx?: Prisma.TransactionClient) {
    const project = await this.projectsService.findOne(organizationId, dto.projectId, tx)

    if (project.status === ProjectStatus.archived) {
      throw new BadRequestException('Cannot create a task for an archived project')
    }

    if (dto.assigneeUserId) {
      await this.membershipService.ensureUserIsMember(dto.assigneeUserId, organizationId, {
        notFoundMessage: 'Assignee not found in this organization',
        exceptionType: 'not_found',
        tx
      })
    }

    const status = dto.status ?? TaskStatus.todo

    const createTask = async (trx: Prisma.TransactionClient) => {
      if (status !== TaskStatus.archived) {
        await this.usagePolicyService.assertCanCreateActiveTask(organizationId, trx)
      }

      const task = await this.taskRepository.create(
        {
          organizationId,
          projectId: dto.projectId,
          assigneeUserId: dto.assigneeUserId,
          title: dto.title,
          description: dto.description,
          status,
          priority: dto.priority ?? TaskPriority.medium,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          archivedAt: status === TaskStatus.archived ? new Date() : null
        },
        trx
      )

      await this.auditLog(task, actorUserId, organizationId, AuditLogAction.created, trx)

      return task
    }

    if (tx) {
      return createTask(tx)
    }

    return this.prisma.$transaction(trx => createTask(trx))
  }

  async findAll(organizationId: string, query: ListTasksQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    if (query.projectId) {
      await this.projectsService.findOne(organizationId, query.projectId, tx)
    }

    if (query.assigneeUserId) {
      await this.membershipService.ensureUserIsMember(query.assigneeUserId, organizationId, {
        notFoundMessage: 'Assignee not found in this organization',
        exceptionType: 'not_found',
        tx
      })
    }

    const { items, nextCursor, hasNextPage } = await this.taskRepository.findManyByOrganization(
      {
        organizationId,
        projectId: query.projectId,
        assigneeUserId: query.assigneeUserId,
        search: query.search,
        status: query.status,
        priority: query.priority,
        includeArchived: query.includeArchived,
        cursor: query.cursor,
        limit
      },
      tx
    )

    return {
      items,
      meta: {
        limit,
        nextCursor,
        hasNextPage
      }
    }
  }

  async findOne(organizationId: string, taskId: string, tx?: Prisma.TransactionClient) {
    const task = await this.taskRepository.findByIdAndOrganization(taskId, organizationId, tx)

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    return task
  }

  async update(
    actorUserId: string,
    organizationId: string,
    taskId: string,
    dto: UpdateTaskDto,
    tx?: Prisma.TransactionClient
  ) {
    const updateTask = async (trx: Prisma.TransactionClient) => {
      const currentTask = await this.getTaskOrThrow(taskId, organizationId, trx)
      const expectedUpdatedAt = new Date(dto.expectedUpdatedAt)

      if (currentTask.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConflictException('Task was updated by another request. Refresh and try again.')
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expectedUpdatedAt: _, ...updateData } = dto
      const nextStatus = updateData.status ?? currentTask.status
      const nextProjectId = updateData.projectId ?? currentTask.projectId
      const isUnarchiving = currentTask.status === TaskStatus.archived && nextStatus !== TaskStatus.archived
      const mustValidateTargetProject = updateData.projectId !== undefined || isUnarchiving

      if (mustValidateTargetProject) {
        const project = await this.projectsService.findOne(organizationId, nextProjectId, trx)

        if (project.status === ProjectStatus.archived) {
          throw new BadRequestException('Cannot move a task to an archived project')
        }
      }

      if (updateData.assigneeUserId) {
        await this.membershipService.ensureUserIsMember(updateData.assigneeUserId, organizationId, {
          notFoundMessage: 'Assignee not found in this organization',
          exceptionType: 'not_found',
          tx: trx
        })
      }

      if (isUnarchiving) {
        await this.usagePolicyService.assertCanCreateActiveTask(organizationId, trx)
      }

      const task = await this.taskRepository.updateWithOptimisticConcurrency(
        taskId,
        organizationId,
        currentTask.updatedAt,
        {
          ...updateData,
          dueDate:
            updateData.dueDate === undefined ? undefined : updateData.dueDate ? new Date(updateData.dueDate) : null,
          archivedAt:
            updateData.status === undefined ? undefined : updateData.status === TaskStatus.archived ? new Date() : null
        },
        trx
      )

      if (!task) {
        throw new ConflictException('Task was updated by another request. Refresh and try again.')
      }

      await this.auditLog(task, actorUserId, organizationId, AuditLogAction.updated, trx)

      return task
    }

    if (tx) {
      return updateTask(tx)
    }

    return this.prisma.$transaction(trx => updateTask(trx))
  }

  async remove(actorUserId: string, organizationId: string, taskId: string, tx?: Prisma.TransactionClient) {
    await this.getTaskOrThrow(taskId, organizationId, tx)

    const task = await this.taskRepository.archive(taskId, tx)

    await this.auditLog(task, actorUserId, organizationId, AuditLogAction.archived, tx)

    return {
      success: true
    }
  }

  private async getTaskOrThrow(taskId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const task = await this.taskRepository.findByIdAndOrganization(taskId, organizationId, tx)

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    return task
  }

  private async auditLog(
    task: Task,
    actorUserId: string,
    organizationId: string,
    action: AuditLogAction,
    tx?: Prisma.TransactionClient
  ) {
    return this.auditLogsService.create(
      {
        organizationId,
        actorUserId,
        entityType: 'task',
        entityId: task.id,
        action,
        metadata: {
          projectId: task.projectId,
          assigneeUserId: task.assigneeUserId,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          archivedAt: task.archivedAt
        }
      },
      tx
    )
  }
}
