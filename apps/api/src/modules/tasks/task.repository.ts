import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util'
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client'

type FindManyByOrganizationParams = {
  organizationId: string
  projectId?: string
  assigneeUserId?: string
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  includeArchived?: boolean
  cursor?: string
  limit: number
}

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
    const { organizationId, projectId, assigneeUserId, search, status, priority, includeArchived, cursor, limit } =
      params

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor)

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
        OR: ['title', 'description'].map(field => ({
          [field]: {
            contains: search,
            mode: 'insensitive'
          }
        }))
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
      orderBy: [
        {
          createdAt: 'desc'
        },
        {
          id: 'desc'
        }
      ],
      take: limit + 1
    })

    const { normalizedItems, hasNextPage, nextCursor } = buildCursorPageResult({
      items,
      limit,
      getCursorPayload: item => ({
        id: item.id,
        createdAt: item.createdAt.toISOString()
      })
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

  async update(id: string, data: Prisma.TaskUpdateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).task.update({
      where: {
        id
      },
      data,
      include: taskInclude
    })
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
