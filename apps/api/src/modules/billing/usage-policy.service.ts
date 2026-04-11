import { ForbiddenException, Injectable } from '@nestjs/common'
import { ClientStatus, Prisma, ProjectStatus, TaskStatus } from '@prisma/client'

import { billingPlanLimits, UsageMetric, usageMetricLabels } from './billing-plan-limits'
import { BillingService } from './billing.service'

@Injectable()
export class UsagePolicyService {
  constructor(private readonly billingService: BillingService) {}

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
    await this.acquireOrganizationUsageLock(organizationId, tx)

    const billing = await this.billingService.getByOrganizationIdOrThrow(organizationId, tx)

    const limit = billingPlanLimits[billing.plan][metric]

    if (limit === null) {
      return
    }

    const currentUsage = await this.getCurrentUsage(metric, organizationId, tx)

    if (currentUsage >= limit) {
      throw new ForbiddenException(`Plan limit reached for ${usageMetricLabels[metric]}`)
    }
  }

  private async acquireOrganizationUsageLock(organizationId: string, tx: Prisma.TransactionClient) {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`usage:${organizationId}`}))
    `
  }

  private async getCurrentUsage(metric: UsageMetric, organizationId: string, tx: Prisma.TransactionClient) {
    switch (metric) {
      case 'members':
        return tx.membership.count({
          where: {
            organizationId
          }
        })

      case 'clients':
        return tx.client.count({
          where: {
            organizationId,
            status: {
              not: ClientStatus.archived
            }
          }
        })

      case 'projects':
        return tx.project.count({
          where: {
            organizationId,
            status: {
              not: ProjectStatus.archived
            }
          }
        })

      case 'active_tasks':
        return tx.task.count({
          where: {
            organizationId,
            status: {
              not: TaskStatus.archived
            }
          }
        })
    }
  }
}
