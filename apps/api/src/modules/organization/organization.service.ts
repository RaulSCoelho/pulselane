import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { BillingService } from '@/modules/billing/billing.service'
import { MembershipService } from '@/modules/membership/membership.service'
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogAction, MembershipRole, Prisma } from '@prisma/client'

import { UpdateOrganizationDto } from './dto/requests/update-organization.dto'
import { OrganizationRepository } from './organization.repository'
import { slugifyOrganizationName, uniqueOrganizationSlug } from './organization.utils'

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly membershipService: MembershipService,
    private readonly billingService: BillingService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async create(name: string, tx?: Prisma.TransactionClient) {
    const createOrganization = async (trx: Prisma.TransactionClient) => {
      const baseSlug = slugifyOrganizationName(name)

      let attempt = 0

      while (true) {
        const slug = uniqueOrganizationSlug(baseSlug, attempt)

        const exists = await this.organizationRepository.findBySlug(slug, trx)

        if (exists) {
          attempt++
          continue
        }

        try {
          const organization = await this.organizationRepository.create({ name, slug }, trx)

          await this.billingService.initializeOrganizationBilling(organization.id, trx)

          return organization
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            attempt++
            continue
          }

          throw error
        }
      }
    }

    if (tx) {
      return createOrganization(tx)
    }

    return this.prisma.$transaction(trx => createOrganization(trx))
  }

  async findAllByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.organizationRepository.findManyByUserId(userId, tx)
  }

  async findCurrentByUserId(userId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const membership = await this.membershipService.ensureUserIsMember(userId, organizationId, { tx })

    const organization = await this.organizationRepository.findById(organizationId, tx)

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    return {
      organization,
      membership
    }
  }

  async getCurrentPayload(userId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const { organization, membership } = await this.findCurrentByUserId(userId, organizationId, tx)
    const billing = await this.billingService.getByOrganizationIdOrThrow(organizationId, tx)
    const usage = await this.billingService.getCurrentUsageSnapshot(organizationId, tx)
    const limits = this.billingService.getPlanLimits(billing.plan)

    return {
      organization,
      currentRole: membership.role,
      plan: {
        plan: billing.plan,
        status: billing.status,
        currentPeriodEnd: billing.currentPeriodEnd,
        cancelAtPeriodEnd: billing.cancelAtPeriodEnd
      },
      limits: {
        members: limits.members,
        clients: limits.clients,
        projects: limits.projects,
        activeTasks: limits.active_tasks
      },
      usage: {
        members: usage.members,
        clients: usage.clients,
        projects: usage.projects,
        activeTasks: usage.active_tasks
      }
    }
  }

  async updateCurrent(
    actorUserId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
    tx?: Prisma.TransactionClient
  ) {
    const updateOrganization = async (trx: Prisma.TransactionClient) => {
      const { organization, membership } = await this.findCurrentByUserId(actorUserId, organizationId, trx)

      if (membership.role !== MembershipRole.owner && membership.role !== MembershipRole.admin) {
        throw new ForbiddenException('You do not have permission to update this organization')
      }

      if (dto.slug && dto.slug !== organization.slug) {
        const existingOrganization = await this.organizationRepository.findBySlug(dto.slug, trx)

        if (existingOrganization && existingOrganization.id !== organization.id) {
          throw new ConflictException('Organization slug already in use')
        }
      }

      const updatedOrganization = await this.organizationRepository.update(
        organization.id,
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {})
        },
        trx
      )

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'organization',
          entityId: updatedOrganization.id,
          action: AuditLogAction.updated,
          metadata: {
            previousName: organization.name,
            previousSlug: organization.slug,
            name: updatedOrganization.name,
            slug: updatedOrganization.slug
          }
        },
        trx
      )

      return this.getCurrentPayload(actorUserId, organizationId, trx)
    }

    if (tx) {
      return updateOrganization(tx)
    }

    return this.prisma.$transaction(trx => updateOrganization(trx))
  }
}
