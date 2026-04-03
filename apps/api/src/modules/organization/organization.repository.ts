import { PrismaService } from '@/infra/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organization.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organization.findUnique({
      where: { slug },
    });
  }

  async findManyByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organization.findMany({
      where: {
        memberships: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(
    data: Prisma.OrganizationCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organization.create({
      data,
    });
  }
}
