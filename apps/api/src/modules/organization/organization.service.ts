import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import {
  slugifyOrganizationName,
  uniqueOrganizationSlug,
} from './organization.utils';
import { Prisma } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly membershipService: MembershipService,
  ) {}

  async create(name: string, tx?: Prisma.TransactionClient) {
    const baseSlug = slugifyOrganizationName(name);

    let attempt = 0;
    let slug: string;

    while (true) {
      slug = uniqueOrganizationSlug(baseSlug, attempt);

      const exists = await this.organizationRepository.findBySlug(slug, tx);

      if (!exists) break;

      attempt++;
    }

    return this.organizationRepository.create({ name, slug }, tx);
  }

  async findAllByUserId(userId: string) {
    return this.organizationRepository.findManyByUserId(userId);
  }

  async findCurrentByUserId(userId: string, organizationId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }
}
