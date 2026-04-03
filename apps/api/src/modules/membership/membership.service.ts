import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRepository } from './membership.repository';
import { MembershipRole, Prisma } from '@prisma/client';

type CreateMembershipInput = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

type EnsureUserIsMemberOptions = {
  notFoundMessage?: string;
  exceptionType?: 'forbidden' | 'not_found';
  tx?: Prisma.TransactionClient;
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
    options?: EnsureUserIsMemberOptions,
  ) {
    const membership =
      await this.membershipRepository.findByUserAndOrganization(
        userId,
        organizationId,
        options?.tx,
      );

    if (!membership) {
      const message =
        options?.notFoundMessage ?? 'User is not a member of this organization';

      if (options?.exceptionType === 'not_found') {
        throw new NotFoundException(message);
      }

      throw new ForbiddenException(message);
    }

    return membership;
  }
}
