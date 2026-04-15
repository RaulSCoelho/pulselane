import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util'
import {
  buildSortableDateFieldIdCursorPayload,
  buildSortableDateFieldIdCursorWhere,
  buildSortableDateFieldIdOrderBy,
  type SortableDateFieldConfigMap
} from '@/common/pagination/utils/sortable-date-field-id-cursor.util'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client'

import { SortDirection, TaskSortBy } from './dto/requests/list-tasks-query.dto'

type FindManyByOrganizationParams = {
  organizationId: string
  projectId?: string
  assigneeUserId?: string
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  overdue?: boolean
  dueDateFrom?: Date
  dueDateTo?: Date
  sortBy?: TaskSortBy
  sortDirection?: SortDirection
  includeArchived?: boolean
  cursor?: string
  limit: number
}

const taskSortConfig = {
  [TaskSortBy.createdAt]: {
    field: 'createdAt'
  },
  [TaskSortBy.dueDate]: {
    field: 'dueDate',
    nullable: true
  }
} satisfies SortableDateFieldConfigMap<TaskSortBy>

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true
    }
  },
  assignee: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.TaskInclude

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma
  }

  async create(data: Prisma.TaskCreateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).task.create({
      data,
      include: taskInclude
    })
  }

  async findManyByOrganization(params: FindManyByOrganizationParams, tx?: Prisma.TransactionClient) {
    const {
      organizationId,
      projectId,
      assigneeUserId,
      search,
      status,
      priority,
      overdue,
      dueDateFrom,
      dueDateTo,
      sortBy = TaskSortBy.createdAt,
      sortDirection = SortDirection.desc,
      includeArchived,
      cursor,
      limit
    } = params

    const cursorWhere = buildSortableDateFieldIdCursorWhere(cursor, sortBy, sortDirection, taskSortConfig)

    const andFilters: Prisma.TaskWhereInput[] = [{ organizationId }]

    if (projectId) {
      andFilters.push({ projectId })
    }

    if (assigneeUserId) {
      andFilters.push({ assigneeUserId })
    }

    if (status) {
      andFilters.push({ status })
    } else if (!includeArchived) {
      andFilters.push({
        status: {
          not: TaskStatus.archived
        }
      })
    }

    if (priority) {
      andFilters.push({ priority })
    }

    if (search) {
      andFilters.push({
        OR: ['title', 'description', 'blockedReason'].map(field => ({
          [field]: {
            contains: search,
            mode: 'insensitive'
          }
        }))
      })
    }

    if (overdue) {
      andFilters.push({
        dueDate: {
          lt: new Date()
        }
      })
      andFilters.push({
        status: {
          notIn: [TaskStatus.done, TaskStatus.archived]
        }
      })
    }

    if (dueDateFrom || dueDateTo) {
      andFilters.push({
        dueDate: {
          ...(dueDateFrom ? { gte: dueDateFrom } : {}),
          ...(dueDateTo ? { lte: dueDateTo } : {})
        }
      })
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere)
    }

    const items = await this.getClient(tx).task.findMany({
      where: {
        AND: andFilters
      },
      include: taskInclude,
      orderBy: buildSortableDateFieldIdOrderBy(sortBy, sortDirection, taskSortConfig),
      take: limit + 1
    })

    const { normalizedItems, hasNextPage, nextCursor } = buildCursorPageResult({
      items,
      limit,
      getCursorPayload: item => buildSortableDateFieldIdCursorPayload(item, sortBy, sortDirection, taskSortConfig)
    })

    return {
      items: normalizedItems,
      hasNextPage,
      nextCursor
    }
  }

  async findByIdAndOrganization(id: string, organizationId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).task.findFirst({
      where: {
        id,
        organizationId
      },
      include: taskInclude
    })
  }

  async updateWithOptimisticConcurrency(
    id: string,
    organizationId: string,
    expectedUpdatedAt: Date,
    data: Prisma.TaskUpdateArgs['data'],
    tx?: Prisma.TransactionClient
  ) {
    const result = await this.getClient(tx).task.updateMany({
      where: {
        id,
        organizationId,
        updatedAt: expectedUpdatedAt
      },
      data
    })

    if (result.count === 0) {
      return null
    }

    return this.findByIdAndOrganization(id, organizationId, tx)
  }

  async archive(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).task.update({
      where: {
        id
      },
      data: {
        status: TaskStatus.archived,
        archivedAt: new Date()
      },
      include: taskInclude
    })
  }
}
