import { Injectable } from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: AuditLogAction;
};

const auditLogInclude = {
  actorUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.AuditLogInclude;

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async create(
    data: Prisma.AuditLogCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).auditLog.create({
      data,
      include: auditLogInclude,
    });
  }

  async findManyByOrganization(
    params: FindManyByOrganizationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const { organizationId, entityType, entityId, actorUserId, action } =
      params;

    return this.getClient(tx).auditLog.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
        actorUserId,
        action,
      },
      include: auditLogInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
