import { Injectable } from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { AuditLogRepository } from './audit-log.repository';
import { ListAuditLogsQueryDto } from './dto/requests/list-audit-logs-query.dto';

type RegisterAuditLogInput = {
  organizationId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: AuditLogAction;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async create(input: RegisterAuditLogInput, tx?: Prisma.TransactionClient) {
    // Audit writes are intentionally lightweight and fire from business services
    // after the main mutation succeeds.
    return this.auditLogRepository.create(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadata: input.metadata,
      },
      tx,
    );
  }

  async findAll(
    organizationId: string,
    query: ListAuditLogsQueryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } =
      await this.auditLogRepository.findManyByOrganization(
        {
          organizationId,
          entityType: query.entityType,
          entityId: query.entityId,
          actorUserId: query.actorUserId,
          action: query.action,
          page,
          pageSize,
        },
        tx,
      );

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
