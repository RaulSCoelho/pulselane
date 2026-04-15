import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util'
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

type FindManyByTaskParams = {
  organizationId: string
  taskId: string
  cursor?: string
  limit: number
  includeDeleted?: boolean
}

type FindActivityHistoryByTaskParams = {
  organizationId: string
  taskId: string
  cursor?: string
  limit: number
}

const commentInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.CommentInclude

type ActivityHistoryRow = {
  id: string
  source: 'comment' | 'audit_log'
  action: string
  entityType: string
  entityId: string
  taskId: string
  content: string | null
  occurredAt: Date
  deletedAt: Date | null
  metadata: Prisma.JsonValue | null
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
}

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma
  }

  async create(data: Prisma.CommentCreateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).comment.create({
      data,
      include: commentInclude
    })
  }

  async findByIdAndOrganization(id: string, organizationId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).comment.findFirst({
      where: {
        id,
        organizationId
      },
      include: commentInclude
    })
  }

  async update(id: string, data: Prisma.CommentUpdateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).comment.update({
      where: {
        id
      },
      data,
      include: commentInclude
    })
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).comment.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      },
      include: commentInclude
    })
  }

  async findManyByTask(params: FindManyByTaskParams, tx?: Prisma.TransactionClient) {
    const { organizationId, taskId, cursor, limit, includeDeleted } = params

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor)

    const andFilters: Prisma.CommentWhereInput[] = [{ organizationId }, { taskId }]

    if (!includeDeleted) {
      andFilters.push({
        deletedAt: null
      })
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere)
    }

    const items = await this.getClient(tx).comment.findMany({
      where: {
        AND: andFilters
      },
      include: commentInclude,
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

  async findActivityHistoryByTask(params: FindActivityHistoryByTaskParams, tx?: Prisma.TransactionClient) {
    const { organizationId, taskId, cursor, limit } = params
    const { decodedCursor } = buildCreatedAtIdCursorFilter(cursor)

    const cursorSql =
      decodedCursor === null
        ? Prisma.empty
        : Prisma.sql`
            AND (
              activity."occurredAt" < ${new Date(decodedCursor.createdAt)}
              OR (
                activity."occurredAt" = ${new Date(decodedCursor.createdAt)}
                AND activity.id < ${decodedCursor.id}
              )
            )
          `

    const rows = await this.getClient(tx).$queryRaw<ActivityHistoryRow[]>(Prisma.sql`
      SELECT *
      FROM (
        SELECT
          c.id,
          'comment'::text AS source,
          'comment_created'::text AS action,
          'comment'::text AS "entityType",
          c.id AS "entityId",
          c.task_id AS "taskId",
          c.body AS content,
          c.created_at AS "occurredAt",
          c.deleted_at AS "deletedAt",
          NULL::jsonb AS metadata,
          u.id AS "actorId",
          u.name AS "actorName",
          u.email AS "actorEmail"
        FROM comments c
        INNER JOIN users u ON u.id = c.author_user_id
        WHERE c.organization_id = ${organizationId}
          AND c.task_id = ${taskId}

        UNION ALL

        SELECT
          al.id,
          'audit_log'::text AS source,
          CASE
            WHEN al.entity_type = 'comment' AND al.action = 'updated' THEN 'comment_updated'
            WHEN al.entity_type = 'comment' AND al.action = 'deleted' THEN 'comment_deleted'
            ELSE al.entity_type || '_' || al.action::text
          END AS action,
          al.entity_type AS "entityType",
          al.entity_id AS "entityId",
          COALESCE(al.metadata->>'taskId', CASE WHEN al.entity_type = 'task' THEN al.entity_id ELSE NULL END) AS "taskId",
          COALESCE(al.metadata->>'body', NULL) AS content,
          al.created_at AS "occurredAt",
          NULL::timestamp AS "deletedAt",
          al.metadata AS metadata,
          u.id AS "actorId",
          u.name AS "actorName",
          u.email AS "actorEmail"
        FROM audit_logs al
        INNER JOIN users u ON u.id = al.actor_user_id
        WHERE al.organization_id = ${organizationId}
          AND (
            (al.entity_type = 'task' AND al.entity_id = ${taskId})
            OR
            (al.entity_type = 'comment' AND al.metadata->>'taskId' = ${taskId})
          )
      ) activity
      WHERE activity."taskId" = ${taskId}
      ${cursorSql}
      ORDER BY activity."occurredAt" DESC, activity.id DESC
      LIMIT ${limit + 1}
    `)

    const { normalizedItems, hasNextPage, nextCursor } = buildCursorPageResult({
      items: rows,
      limit,
      getCursorPayload: item => ({
        id: item.id,
        createdAt: item.occurredAt.toISOString()
      })
    })

    return {
      items: normalizedItems,
      hasNextPage,
      nextCursor
    }
  }
}
