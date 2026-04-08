import { Injectable } from '@nestjs/common';
import { OrganizationInvitationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  page: number;
  pageSize: number;
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
    const { organizationId, page, pageSize, email, status } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrganizationInvitationWhereInput = {
      organizationId,
      status,
      email: email
        ? {
            contains: email,
            mode: 'insensitive',
          }
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.getClient(tx).organizationInvitation.findMany({
        where,
        include: invitationInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.getClient(tx).organizationInvitation.count({ where }),
    ]);

    return {
      items,
      total,
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
