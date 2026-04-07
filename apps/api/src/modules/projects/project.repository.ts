import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  clientId?: string;
  search?: string;
  status?: ProjectStatus;
  page: number;
  pageSize: number;
};

const clientInclude = {
  select: {
    id: true,
    name: true,
  },
} satisfies Prisma.ProjectInclude['client'];

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
      include: {
        client: clientInclude,
      },
    });
  }

  async findManyByOrganization(
    params: FindManyByOrganizationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const { organizationId, clientId, search, status, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProjectWhereInput = {
      organizationId,
      clientId,
      status,
      OR: search
        ? ['name', 'description'].map((field) => ({
            [field]: { contains: search, mode: 'insensitive' },
          }))
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.getClient(tx).project.findMany({
        where,
        include: {
          client: clientInclude,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.getClient(tx).project.count({ where }),
    ]);

    return {
      items,
      total,
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
      include: {
        client: clientInclude,
      },
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
      include: {
        client: clientInclude,
      },
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).project.delete({
      where: {
        id,
      },
    });
  }
}
