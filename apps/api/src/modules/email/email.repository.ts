import { Injectable } from '@nestjs/common';
import { EmailDeliveryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util';
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util';

type FindManyParams = {
  organizationId: string;
  cursor?: string;
  limit: number;
  to?: string;
  status?: EmailDeliveryStatus;
};

const emailDeliveryInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.EmailDeliveryInclude;

@Injectable()
export class EmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.EmailDeliveryCreateArgs['data']) {
    return this.prisma.emailDelivery.create({
      data,
      include: emailDeliveryInclude,
    });
  }

  async update(id: string, data: Prisma.EmailDeliveryUpdateArgs['data']) {
    return this.prisma.emailDelivery.update({
      where: { id },
      data,
      include: emailDeliveryInclude,
    });
  }

  async findMany(params: FindManyParams) {
    const { organizationId, cursor, limit, to, status } = params;

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor);

    const andFilters: Prisma.EmailDeliveryWhereInput[] = [{ organizationId }];

    if (status) {
      andFilters.push({ status });
    }

    if (to) {
      andFilters.push({
        to: {
          contains: to,
          mode: 'insensitive',
        },
      });
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere);
    }

    const items = await this.prisma.emailDelivery.findMany({
      where: {
        AND: andFilters,
      },
      include: emailDeliveryInclude,
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
}
