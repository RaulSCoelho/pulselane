import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ClientStatus, Prisma, ProjectStatus, TaskStatus } from '@prisma/client'

import { billingPlanLimits, type UsageMetric } from './billing-plan-limits'
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

  getPlanLimits(plan: keyof typeof billingPlanLimits) {
    return billingPlanLimits[plan]
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
}
