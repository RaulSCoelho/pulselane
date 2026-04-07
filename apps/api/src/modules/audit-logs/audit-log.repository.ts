import { Injectable } from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: AuditLogAction;
  page: number;
  pageSize: number;
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
    const {
      organizationId,
      entityType,
      entityId,
      actorUserId,
      action,
      page,
      pageSize,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      entityType,
      entityId,
      actorUserId,
      action,
    };

    const [items, total] = await Promise.all([
      this.getClient(tx).auditLog.findMany({
        where,
        include: auditLogInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.getClient(tx).auditLog.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }
}
