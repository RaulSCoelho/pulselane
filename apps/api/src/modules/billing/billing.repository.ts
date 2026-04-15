import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { MembershipRole, Prisma } from '@prisma/client'

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma
  }

  async upsertOrganizationBilling(organizationId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organizationBilling.upsert({
      where: {
        organizationId
      },
      create: {
        organizationId
      },
      update: {}
    })
  }

  async findByOrganizationId(organizationId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organizationBilling.findUnique({
      where: {
        organizationId
      }
    })
  }

  async findByStripeCustomerId(stripeCustomerId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organizationBilling.findUnique({
      where: {
        stripeCustomerId
      }
    })
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).organizationBilling.findUnique({
      where: {
        stripeSubscriptionId
      }
    })
  }

  async updateOrganizationBilling(
    organizationId: string,
    data: Prisma.OrganizationBillingUpdateArgs['data'],
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).organizationBilling.update({
      where: {
        organizationId
      },
      data
    })
  }

  async createWebhookEvent(data: Prisma.BillingWebhookEventCreateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).billingWebhookEvent.create({
      data
    })
  }

  async findWebhookEventByProviderEventId(providerEventId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).billingWebhookEvent.findUnique({
      where: {
        providerEventId
      }
    })
  }

  async markWebhookEventProcessed(
    providerEventId: string,
    data: Prisma.BillingWebhookEventUpdateArgs['data'],
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).billingWebhookEvent.update({
      where: {
        providerEventId
      },
      data
    })
  }

  async findAuditActorUserIdByOrganizationId(organizationId: string, tx?: Prisma.TransactionClient) {
    const owner = await this.getClient(tx).membership.findFirst({
      where: {
        organizationId,
        role: MembershipRole.owner
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        userId: true
      }
    })

    if (owner) {
      return owner.userId
    }

    const admin = await this.getClient(tx).membership.findFirst({
      where: {
        organizationId,
        role: MembershipRole.admin
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        userId: true
      }
    })

    return admin?.userId ?? null
  }
}
