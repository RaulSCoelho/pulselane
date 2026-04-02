import { Injectable } from '@nestjs/common';
import { MembershipRepository } from './membership.repository';
import { MembershipRole, Prisma } from '@prisma/client';

type CreateMembershipInput = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

@Injectable()
export class MembershipService {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async create(data: CreateMembershipInput, tx?: Prisma.TransactionClient) {
    return this.membershipRepository.create(data, tx);
  }

  async ensureUserIsMember(
    userId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const membership =
      await this.membershipRepository.findByUserAndOrganization(
        userId,
        organizationId,
        tx,
      );

    if (!membership) {
      throw new Error('User is not a member of this organization');
    }

    return membership;
  }
}
