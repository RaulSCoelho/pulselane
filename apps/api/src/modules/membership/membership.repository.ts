import { PrismaService } from '@/infra/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

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
}
