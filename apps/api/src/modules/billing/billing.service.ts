import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BillingRepository } from './billing.repository';

@Injectable()
export class BillingService {
  constructor(private readonly billingRepository: BillingRepository) {}

  async initializeOrganizationBilling(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.billingRepository.upsertOrganizationBilling(organizationId, tx);
  }

  async findByOrganizationId(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.billingRepository.findByOrganizationId(organizationId, tx);
  }

  async getByOrganizationIdOrThrow(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const billing = await this.billingRepository.findByOrganizationId(
      organizationId,
      tx,
    );

    if (!billing) {
      throw new NotFoundException('Organization billing not found');
    }

    return billing;
  }
}
