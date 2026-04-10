import { Injectable } from '@nestjs/common';
import { Prisma, ClientStatus } from '@prisma/client';
import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util';
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  search?: string;
  status?: ClientStatus;
  includeArchived?: boolean;
  cursor?: string;
  limit: number;
};

@Injectable()
export class ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async create(
    data: Prisma.ClientCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).client.create({
      data,
    });
  }

  async findManyByOrganization(
    params: FindManyByOrganizationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const { organizationId, search, status, includeArchived, cursor, limit } =
      params;

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor);

    const andFilters: Prisma.ClientWhereInput[] = [{ organizationId }];

    if (status) {
      andFilters.push({ status });
    } else if (!includeArchived) {
      andFilters.push({
        status: {
          not: ClientStatus.archived,
        },
      });
    }

    if (search) {
      andFilters.push({
        OR: ['name', 'email', 'companyName'].map((field) => ({
          [field]: {
            contains: search,
            mode: 'insensitive',
          },
        })),
      });
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere);
    }

    const items = await this.getClient(tx).client.findMany({
      where: {
        AND: andFilters,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: limit + 1,
    });

    const { normalizedItems, hasNextPage, nextCursor } = buildCursorPageResult({
      items,
      limit,
      getCursorPayload: (item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
      }),
    });

    return {
      items: normalizedItems,
      hasNextPage,
      nextCursor,
    };
  }

  async findByIdAndOrganization(
    id: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).client.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.ClientUpdateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).client.update({
      where: {
        id,
      },
      data,
    });
  }

  async archive(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).client.update({
      where: {
        id,
      },
      data: {
        status: ClientStatus.archived,
        archivedAt: new Date(),
      },
    });
  }
}
