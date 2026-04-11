import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util'
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { AuditLogAction, Prisma } from '@prisma/client'

type FindManyByOrganizationParams = {
  organizationId: string
  entityType?: string
  entityId?: string
  actorUserId?: string
  action?: AuditLogAction
  cursor?: string
  limit: number
}

const auditLogInclude = {
  actorUser: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.AuditLogInclude

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma
  }

  async create(data: Prisma.AuditLogCreateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).auditLog.create({
      data,
      include: auditLogInclude
    })
  }

  async findManyByOrganization(params: FindManyByOrganizationParams, tx?: Prisma.TransactionClient) {
    const { organizationId, entityType, entityId, actorUserId, action, cursor, limit } = params

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor)

    const andFilters: Prisma.AuditLogWhereInput[] = [{ organizationId }]

    if (entityType) {
      andFilters.push({ entityType })
    }

    if (entityId) {
      andFilters.push({ entityId })
    }

    if (actorUserId) {
      andFilters.push({ actorUserId })
    }

    if (action) {
      andFilters.push({ action })
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere)
    }

    const items = await this.getClient(tx).auditLog.findMany({
      where: {
        AND: andFilters
      },
      include: auditLogInclude,
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
}
