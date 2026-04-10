import { Injectable } from '@nestjs/common';
import { OrganizationInvitationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util';
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util';

type FindManyByOrganizationParams = {
  organizationId: string;
  cursor?: string;
  limit: number;
  email?: string;
  status?: OrganizationInvitationStatus;
};

const invitationInclude = {
  invitedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.OrganizationInvitationInclude;

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async create(
    data: Prisma.OrganizationInvitationCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organizationInvitation.create({
      data,
      include: invitationInclude,
    });
  }

  async findByToken(token: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organizationInvitation.findUnique({
      where: { token },
      include: invitationInclude,
    });
  }

  async findPendingByOrganizationAndEmail(
    organizationId: string,
    email: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organizationInvitation.findFirst({
      where: {
        organizationId,
        email,
        status: OrganizationInvitationStatus.pending,
      },
      include: invitationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByIdAndOrganization(
    id: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organizationInvitation.findFirst({
      where: {
        id,
        organizationId,
      },
      include: invitationInclude,
    });
  }

  async findManyByOrganization(
    params: FindManyByOrganizationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const { organizationId, cursor, limit, email, status } = params;

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor);

    const andFilters: Prisma.OrganizationInvitationWhereInput[] = [
      { organizationId },
    ];

    if (status) {
      andFilters.push({ status });
    }

    if (email) {
      andFilters.push({
        email: {
          contains: email,
          mode: 'insensitive',
        },
      });
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere);
    }

    const items = await this.getClient(tx).organizationInvitation.findMany({
      where: {
        AND: andFilters,
      },
      include: invitationInclude,
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

  async update(
    id: string,
    data: Prisma.OrganizationInvitationUpdateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organizationInvitation.update({
      where: { id },
      data,
      include: invitationInclude,
    });
  }
}
