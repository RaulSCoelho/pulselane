import { Injectable } from '@nestjs/common';
import { Prisma, ClientStatus } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  search?: string;
  status?: ClientStatus;
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
    const { organizationId, search, status } = params;

    return this.getClient(tx).client.findMany({
      where: {
        organizationId,
        status,
        OR: search
          ? ['name', 'email', 'companyName'].map((field) => ({
              [field]: { contains: search, mode: 'insensitive' },
            }))
          : undefined,
      },
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

  async delete(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).client.delete({
      where: {
        id,
      },
    });
  }
}
