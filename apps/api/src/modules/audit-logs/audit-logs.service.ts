import { Injectable } from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
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
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly membershipService: MembershipService,
  ) {}

  async create(input: RegisterAuditLogInput) {
    return this.auditLogRepository.create({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata,
    });
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: ListAuditLogsQueryDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    return this.auditLogRepository.findManyByOrganization({
      organizationId,
      entityType: query.entityType,
      entityId: query.entityId,
      actorUserId: query.actorUserId,
      action: query.action,
    });
  }
}
