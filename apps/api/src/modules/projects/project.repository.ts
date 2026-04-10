import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util';
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  clientId?: string;
  search?: string;
  status?: ProjectStatus;
  includeArchived?: boolean;
  cursor?: string;
  limit: number;
};

const clientInclude = {
  client: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async create(
    data: Prisma.ProjectCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).project.create({
      data,
      include: clientInclude,
    });
  }

  async findManyByOrganization(
    params: FindManyByOrganizationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const {
      organizationId,
      clientId,
      search,
      status,
      includeArchived,
      cursor,
      limit,
    } = params;

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor);

    const andFilters: Prisma.ProjectWhereInput[] = [{ organizationId }];

    if (clientId) {
      andFilters.push({ clientId });
    }

    if (status) {
      andFilters.push({ status });
    } else if (!includeArchived) {
      andFilters.push({
        status: {
          not: ProjectStatus.archived,
        },
      });
    }

    if (search) {
      andFilters.push({
        OR: ['name', 'description'].map((field) => ({
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

    const items = await this.getClient(tx).project.findMany({
      where: {
        AND: andFilters,
      },
      include: clientInclude,
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
    return this.getClient(tx).project.findFirst({
      where: {
        id,
        organizationId,
      },
      include: clientInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.ProjectUpdateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).project.update({
      where: {
        id,
      },
      data,
      include: clientInclude,
    });
  }

  async archive(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).project.update({
      where: {
        id,
      },
      data: {
        status: ProjectStatus.archived,
        archivedAt: new Date(),
      },
      include: clientInclude,
    });
  }
}
