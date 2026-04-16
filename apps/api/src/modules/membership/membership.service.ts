import { SuccessResponseDto } from '@/common/dto/success-response.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { UsagePolicyService } from '@/modules/billing/usage-policy.service'
import { TaskAssignmentService } from '@/modules/tasks/task-assignment.service'
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogAction, MembershipRole, Prisma } from '@prisma/client'

import { ListMembershipsQueryDto } from './dto/requests/list-memberships-query.dto'
import { UpdateMembershipRoleDto } from './dto/requests/update-membership-role.dto'
import { MembershipRepository } from './membership.repository'

type CreateMembershipInput = {
  userId: string
  organizationId: string
  role: MembershipRole
}

type EnsureUserIsMemberOptions = {
  notFoundMessage?: string
  exceptionType?: 'forbidden' | 'not_found'
  tx?: Prisma.TransactionClient
}

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipRepository: MembershipRepository,
    private readonly usagePolicyService: UsagePolicyService,
    private readonly auditLogsService: AuditLogsService,
    private readonly taskAssignmentService: TaskAssignmentService
  ) {}

  async create(data: CreateMembershipInput, tx?: Prisma.TransactionClient) {
    const createMembership = async (trx: Prisma.TransactionClient) => {
      await this.usagePolicyService.assertCanCreateMembership(data.organizationId, trx)

      try {
        return await this.membershipRepository.create(data, trx)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('User already belongs to this organization')
        }

        throw error
      }
    }

    if (tx) {
      return createMembership(tx)
    }

    return this.prisma.$transaction(trx => createMembership(trx))
  }

  async findByUserAndOrganization(userId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    return this.membershipRepository.findByUserAndOrganization(userId, organizationId, tx)
  }

  async ensureUserIsMember(userId: string, organizationId: string, options?: EnsureUserIsMemberOptions) {
    const membership = await this.membershipRepository.findByUserAndOrganization(userId, organizationId, options?.tx)

    if (!membership) {
      const message = options?.notFoundMessage ?? 'User is not a member of this organization'

      if (options?.exceptionType === 'not_found') {
        throw new NotFoundException(message)
      }

      throw new ForbiddenException(message)
    }

    return membership
  }

  async findAllByOrganization(organizationId: string, query: ListMembershipsQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    const result = await this.membershipRepository.findManyByOrganization(
      {
        organizationId,
        cursor: query.cursor,
        limit,
        search: query.search,
        role: query.role
      },
      tx
    )

    return {
      items: result.items,
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor
      }
    }
  }

  async findOneByOrganization(organizationId: string, membershipId: string, tx?: Prisma.TransactionClient) {
    const membership = await this.membershipRepository.findByIdAndOrganization(membershipId, organizationId, tx)

    if (!membership) {
      throw new NotFoundException('Membership not found')
    }

    return membership
  }

  async updateRole(
    actorUserId: string,
    organizationId: string,
    membershipId: string,
    dto: UpdateMembershipRoleDto,
    tx?: Prisma.TransactionClient
  ) {
    const updateMembershipRole = async (trx: Prisma.TransactionClient) => {
      await this.acquireOrganizationMembershipLock(organizationId, trx)

      const actorMembership = await this.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      if (actorMembership.role !== MembershipRole.owner && actorMembership.role !== MembershipRole.admin) {
        throw new ForbiddenException('You do not have permission to manage memberships')
      }

      const targetMembership = await this.findOneByOrganization(organizationId, membershipId, trx)

      if (actorMembership.role === MembershipRole.admin) {
        if (targetMembership.role === MembershipRole.owner) {
          throw new ForbiddenException('Admins cannot update owner memberships')
        }

        if (dto.role === MembershipRole.owner) {
          throw new ForbiddenException('Admins cannot assign owner role')
        }
      }

      if (
        actorMembership.userId === targetMembership.userId &&
        targetMembership.role === MembershipRole.owner &&
        dto.role !== MembershipRole.owner
      ) {
        throw new ForbiddenException('Owner cannot remove own owner role')
      }

      if (targetMembership.role === MembershipRole.owner && dto.role !== MembershipRole.owner) {
        const ownerCount = await this.membershipRepository.countByOrganizationAndRole(
          organizationId,
          MembershipRole.owner,
          trx
        )

        if (ownerCount <= 1) {
          throw new ConflictException('Organization must have at least one owner')
        }
      }

      return this.membershipRepository.updateRole(membershipId, dto.role, trx)
    }

    if (tx) {
      return updateMembershipRole(tx)
    }

    return this.prisma.$transaction(trx => updateMembershipRole(trx))
  }

  async remove(
    actorUserId: string,
    organizationId: string,
    membershipId: string,
    tx?: Prisma.TransactionClient
  ): Promise<SuccessResponseDto> {
    const removeMembership = async (trx: Prisma.TransactionClient) => {
      await this.acquireOrganizationMembershipLock(organizationId, trx)

      const actorMembership = await this.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      if (actorMembership.role !== MembershipRole.owner && actorMembership.role !== MembershipRole.admin) {
        throw new ForbiddenException('You do not have permission to manage memberships')
      }

      const targetMembership = await this.findOneByOrganization(organizationId, membershipId, trx)

      if (actorMembership.role === MembershipRole.admin && targetMembership.role === MembershipRole.owner) {
        throw new ForbiddenException('Admins cannot remove owner memberships')
      }

      if (targetMembership.role === MembershipRole.owner) {
        const ownerCount = await this.membershipRepository.countByOrganizationAndRole(
          organizationId,
          MembershipRole.owner,
          trx
        )

        if (ownerCount <= 1) {
          throw new ConflictException('Organization must have at least one owner')
        }
      }

      const unassignedTasks = await this.taskAssignmentService.unassignAllByUser(
        organizationId,
        targetMembership.userId,
        trx
      )

      await this.membershipRepository.delete(membershipId, trx)

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'membership',
          entityId: targetMembership.id,
          action: AuditLogAction.deleted,
          metadata: {
            removedUserId: targetMembership.userId,
            removedRole: targetMembership.role,
            assigneePolicy: 'set_null',
            unassignedTasksCount: unassignedTasks.count
          }
        },
        trx
      )

      return {
        success: true
      }
    }

    if (tx) {
      return removeMembership(tx)
    }

    return this.prisma.$transaction(trx => removeMembership(trx))
  }

  private async acquireOrganizationMembershipLock(organizationId: string, tx: Prisma.TransactionClient) {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`organization-memberships:${organizationId}`}))
    `
  }
}
