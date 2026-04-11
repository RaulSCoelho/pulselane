import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole, Prisma } from '@prisma/client';
import { UsagePolicyService } from '@/modules/billing/usage-policy.service';
import { MembershipRepository } from './membership.repository';
import { ListMembershipsQueryDto } from './dto/requests/list-memberships-query.dto';
import { UpdateMembershipRoleDto } from './dto/requests/update-membership-role.dto';
import { PrismaService } from '@/infra/prisma/prisma.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipRepository: MembershipRepository,
    private readonly usagePolicyService: UsagePolicyService,
  ) {}

  async create(data: CreateMembershipInput, tx?: Prisma.TransactionClient) {
    const createMembership = async (trx: Prisma.TransactionClient) => {
      await this.usagePolicyService.assertCanCreateMembership(
        data.organizationId,
        trx,
      );

      try {
        return await this.membershipRepository.create(data, trx);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'User already belongs to this organization',
          );
        }

        throw error;
      }
    };

    if (tx) {
      return createMembership(tx);
    }

    return this.prisma.$transaction((trx) => createMembership(trx));
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.membershipRepository.findByUserAndOrganization(
      userId,
      organizationId,
      tx,
    );
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

  async findAllByOrganization(
    organizationId: string,
    query: ListMembershipsQueryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const limit = query.limit ?? 20;

    const result = await this.membershipRepository.findManyByOrganization(
      {
        organizationId,
        cursor: query.cursor,
        limit,
        search: query.search,
        role: query.role,
      },
      tx,
    );

    return {
      items: result.items,
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor,
      },
    };
  }

  async findOneByOrganization(
    organizationId: string,
    membershipId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const membership = await this.membershipRepository.findByIdAndOrganization(
      membershipId,
      organizationId,
      tx,
    );

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async updateRole(
    actorUserId: string,
    organizationId: string,
    membershipId: string,
    dto: UpdateMembershipRoleDto,
    tx?: Prisma.TransactionClient,
  ) {
    const actorMembership = await this.ensureUserIsMember(
      actorUserId,
      organizationId,
      { tx },
    );

    if (
      actorMembership.role !== MembershipRole.owner &&
      actorMembership.role !== MembershipRole.admin
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage memberships',
      );
    }

    const targetMembership = await this.findOneByOrganization(
      organizationId,
      membershipId,
      tx,
    );

    if (
      actorMembership.role === MembershipRole.admin &&
      targetMembership.role === MembershipRole.owner
    ) {
      throw new ForbiddenException('Admins cannot update owner memberships');
    }

    if (
      actorMembership.userId === targetMembership.userId &&
      targetMembership.role === MembershipRole.owner &&
      dto.role !== MembershipRole.owner
    ) {
      throw new ForbiddenException('Owner cannot remove own owner role');
    }

    return this.membershipRepository.updateRole(membershipId, dto.role, tx);
  }
}
