import { PrismaService } from '@/infra/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { MembershipRole, Prisma } from '@prisma/client';

const membershipInclude = {
  user: {
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
} satisfies Prisma.MembershipInclude;

@Injectable()
export class MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async create(
    data: Prisma.MembershipCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).membership.create({
      data,
    });
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  async findByIdAndOrganization(id: string, organizationId: string) {
    return this.prisma.membership.findFirst({
      where: {
        id,
        organizationId,
      },
      include: membershipInclude,
    });
  }

  async findManyByOrganization(
    organizationId: string,
    params?: {
      page: number;
      pageSize: number;
      search?: string;
      role?: MembershipRole | undefined;
    },
  ) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.MembershipWhereInput = {
      organizationId,
      role: params?.role,
      OR: params?.search
        ? ['name', 'email'].map((field) => ({
            user: {
              [field]: { contains: params.search, mode: 'insensitive' },
            },
          }))
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: membershipInclude,
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.membership.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }

  async updateRole(id: string, role: Prisma.MembershipUpdateInput['role']) {
    return this.prisma.membership.update({
      where: { id },
      data: { role },
      include: membershipInclude,
    });
  }
}
