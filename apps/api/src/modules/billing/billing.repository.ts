import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async upsertOrganizationBilling(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organizationBilling.upsert({
      where: {
        organizationId,
      },
      create: {
        organizationId,
      },
      update: {},
    });
  }

  async findByOrganizationId(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organizationBilling.findUnique({
      where: {
        organizationId,
      },
    });
  }
}
