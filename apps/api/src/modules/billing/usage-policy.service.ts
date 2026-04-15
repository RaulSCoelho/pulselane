import { PrismaService } from '@/infra/prisma/prisma.service'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { type UsageMetric, usageMetricLabels } from './billing-plan-limits'
import { BillingService } from './billing.service'

@Injectable()
export class UsagePolicyService {
  constructor(
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService
  ) {}

  async assertCanCreateMembership(organizationId: string, tx: Prisma.TransactionClient) {
    await this.assertWithinPlanLimit(organizationId, 'members', tx)
  }

  async assertCanCreateClient(organizationId: string, tx: Prisma.TransactionClient) {
    await this.assertWithinPlanLimit(organizationId, 'clients', tx)
  }

  async assertCanCreateProject(organizationId: string, tx: Prisma.TransactionClient) {
    await this.assertWithinPlanLimit(organizationId, 'projects', tx)
  }

  async assertCanCreateActiveTask(organizationId: string, tx: Prisma.TransactionClient) {
    await this.assertWithinPlanLimit(organizationId, 'active_tasks', tx)
  }

  private async assertWithinPlanLimit(organizationId: string, metric: UsageMetric, tx: Prisma.TransactionClient) {
    const assert = async (trx: Prisma.TransactionClient) => {
      await this.acquireOrganizationUsageLock(organizationId, trx)

      const billing = await this.billingService.getByOrganizationIdOrThrow(organizationId, trx)
      const limit = this.billingService.getPlanLimits(billing.plan)[metric]

      if (limit === null) {
        return
      }

      const currentUsage = await this.billingService.getCurrentUsageMetric(metric, organizationId, trx)

      if (currentUsage >= limit) {
        throw new ForbiddenException(`Plan limit reached for ${usageMetricLabels[metric]}`)
      }
    }

    if (tx) {
      return assert(tx)
    }

    return this.prisma.$transaction(trx => assert(trx))
  }

  private async acquireOrganizationUsageLock(organizationId: string, tx: Prisma.TransactionClient) {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`usage:${organizationId}`}))
    `
  }
}
