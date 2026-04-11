import { Injectable } from '@nestjs/common'
import { AuditLogAction, Prisma } from '@prisma/client'

import { AuditLogRepository } from './audit-log.repository'
import { ListAuditLogsQueryDto } from './dto/requests/list-audit-logs-query.dto'

type RegisterAuditLogInput = {
  organizationId: string
  actorUserId: string
  entityType: string
  entityId: string
  action: AuditLogAction
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async create(input: RegisterAuditLogInput, tx?: Prisma.TransactionClient) {
    return this.auditLogRepository.create(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadata: input.metadata
      },
      tx
    )
  }

  async findAll(organizationId: string, query: ListAuditLogsQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    const { items, nextCursor, hasNextPage } = await this.auditLogRepository.findManyByOrganization(
      {
        organizationId,
        entityType: query.entityType,
        entityId: query.entityId,
        actorUserId: query.actorUserId,
        action: query.action,
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
}
