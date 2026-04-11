import { PrismaService } from '@/infra/prisma/prisma.service'
import { BillingService } from '@/modules/billing/billing.service'
import { MembershipService } from '@/modules/membership/membership.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { OrganizationRepository } from './organization.repository'
import { slugifyOrganizationName, uniqueOrganizationSlug } from './organization.utils'

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly membershipService: MembershipService,
    private readonly billingService: BillingService
  ) {}

  async create(name: string, tx?: Prisma.TransactionClient) {
    const createOrganization = async (trx: Prisma.TransactionClient) => {
      const baseSlug = slugifyOrganizationName(name)

      let attempt = 0
      let slug: string

      while (true) {
        slug = uniqueOrganizationSlug(baseSlug, attempt)

        const exists = await this.organizationRepository.findBySlug(slug, trx)

        if (!exists) break

        attempt++
      }

      const organization = await this.organizationRepository.create({ name, slug }, trx)

      await this.billingService.initializeOrganizationBilling(organization.id, trx)

      return organization
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
}
