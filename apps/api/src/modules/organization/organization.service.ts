import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import {
  slugifyOrganizationName,
  uniqueOrganizationSlug,
} from './organization.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
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
}
