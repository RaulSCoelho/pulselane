import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { BillingPlan, BillingSubscriptionStatus, ClientStatus, Prisma, ProjectStatus, TaskStatus } from '@prisma/client'

import {
  billingPlanCatalog,
  BillingPlanActionType,
  BillingPlanChangeKind,
  getBillingPlanCatalogList,
  getBillingPlanRank,
  type UsageMetric
} from './billing-plan-catalog'
import { billingPlanLimits } from './billing-plan-limits'
import { BillingRepository } from './billing.repository'

export type OrganizationUsageSnapshot = Record<UsageMetric, number>

@Injectable()
export class BillingService {
  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly prisma: PrismaService
  ) {}

  async initializeOrganizationBilling(organizationId: string, tx?: Prisma.TransactionClient) {
    return this.billingRepository.upsertOrganizationBilling(organizationId, tx)
  }

  async findByOrganizationId(organizationId: string, tx?: Prisma.TransactionClient) {
    return this.billingRepository.findByOrganizationId(organizationId, tx)
  }

  async getByOrganizationIdOrThrow(organizationId: string, tx?: Prisma.TransactionClient) {
    const billing = await this.billingRepository.findByOrganizationId(organizationId, tx)

    if (!billing) {
      throw new NotFoundException('Organization billing not found')
    }

    return billing
  }

  getPlanLimits(plan: BillingPlan) {
    return billingPlanLimits[plan]
  }

  getPlanCatalog() {
    return getBillingPlanCatalogList()
  }

  getPlanCatalogEntry(plan: BillingPlan) {
    return billingPlanCatalog[plan]
  }

  async getPlansCatalogForOrganization(organizationId: string, tx?: Prisma.TransactionClient) {
    const billing = await this.getByOrganizationIdOrThrow(organizationId, tx)

    return {
      current: {
        plan: billing.plan,
        status: billing.status,
        cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
        currentPeriodEnd: billing.currentPeriodEnd,
        stripeCustomerConfigured: Boolean(billing.stripeCustomerId),
        stripeSubscriptionConfigured: Boolean(billing.stripeSubscriptionId)
      },
      plans: this.getPlanCatalog().map(planEntry => {
        const action = this.resolvePlanAction(billing.plan, planEntry.plan, billing)
        const changeKind = this.resolveChangeKind(billing.plan, planEntry.plan)

        return {
          plan: planEntry.plan,
          displayName: planEntry.displayName,
          description: planEntry.description,
          monthlyPriceCents: planEntry.monthlyPriceCents,
          currency: planEntry.currency,
          billingInterval: planEntry.billingInterval,
          isFree: planEntry.isFree,
          isCurrent: billing.plan === planEntry.plan,
          action,
          changeKind,
          limits: planEntry.limits
        }
      })
    }
  }

  async getCurrentUsageSnapshot(
    organizationId: string,
    tx?: Prisma.TransactionClient
  ): Promise<OrganizationUsageSnapshot> {
    const client = tx ?? this.prisma

    const [members, clients, projects, activeTasks] = await Promise.all([
      client.membership.count({
        where: {
          organizationId
        }
      }),
      client.client.count({
        where: {
          organizationId,
          status: {
            not: ClientStatus.archived
          }
        }
      }),
      client.project.count({
        where: {
          organizationId,
          status: {
            not: ProjectStatus.archived
          }
        }
      }),
      client.task.count({
        where: {
          organizationId,
          status: {
            not: TaskStatus.archived
          }
        }
      })
    ])

    return {
      members,
      clients,
      projects,
      active_tasks: activeTasks
    }
  }

  async getCurrentUsageMetric(metric: UsageMetric, organizationId: string, tx?: Prisma.TransactionClient) {
    const usage = await this.getCurrentUsageSnapshot(organizationId, tx)
    return usage[metric]
  }

  async getReservedMembershipUsage(organizationId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma

    const [members, pendingInvitations] = await Promise.all([
      this.getCurrentUsageMetric('members', organizationId, tx),
      client.organizationInvitation.count({
        where: {
          organizationId,
          status: 'pending'
        }
      })
    ])

    return members + pendingInvitations
  }

  private resolvePlanAction(
    currentPlan: BillingPlan,
    targetPlan: BillingPlan,
    billing: {
      plan: BillingPlan
      status: BillingSubscriptionStatus
      stripeCustomerId: string | null
    }
  ): BillingPlanActionType {
    if (currentPlan === targetPlan) {
      return BillingPlanActionType.current
    }

    if (currentPlan === BillingPlan.free) {
      return billingPlanCatalog[targetPlan].isFree ? BillingPlanActionType.current : BillingPlanActionType.checkout
    }

    if (billing.stripeCustomerId) {
      return BillingPlanActionType.manage_in_portal
    }

    return BillingPlanActionType.unavailable
  }

  private resolveChangeKind(currentPlan: BillingPlan, targetPlan: BillingPlan): BillingPlanChangeKind {
    if (currentPlan === targetPlan) {
      return BillingPlanChangeKind.none
    }

    const currentRank = getBillingPlanRank(currentPlan)
    const targetRank = getBillingPlanRank(targetPlan)

    if (targetRank > currentRank) {
      return BillingPlanChangeKind.upgrade
    }

    if (targetRank < currentRank) {
      return BillingPlanChangeKind.downgrade
    }

    return BillingPlanChangeKind.lateral
  }
}
