import { buildCreatedAtIdCursorFilter } from '@/common/pagination/utils/cursor-filter.util'
import { buildCursorPageResult } from '@/common/pagination/utils/cursor-page.util'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { MembershipRole, Prisma } from '@prisma/client'

type FindManyByOrganizationParams = {
  organizationId: string
  cursor?: string
  limit: number
  search?: string
  role?: MembershipRole | undefined
}

const membershipInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  organization: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
} satisfies Prisma.MembershipInclude

@Injectable()
export class MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma
  }

  async create(data: Prisma.MembershipCreateArgs['data'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).membership.create({
      data
    })
  }

  async findByUserAndOrganization(userId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    })
  }

  async findByIdAndOrganization(id: string, organizationId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).membership.findFirst({
      where: {
        id,
        organizationId
      },
      include: membershipInclude
    })
  }

  async countByOrganizationAndRole(
    organizationId: string,
    role: MembershipRole,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    return this.getClient(tx).membership.count({
      where: {
        organizationId,
        role
      }
    })
  }

  async findManyByOrganization(params: FindManyByOrganizationParams, tx?: Prisma.TransactionClient) {
    const { organizationId, cursor, limit, search, role } = params

    const { where: cursorWhere } = buildCreatedAtIdCursorFilter(cursor)

    const andFilters: Prisma.MembershipWhereInput[] = [{ organizationId }]

    if (role) {
      andFilters.push({ role })
    }

    if (search) {
      andFilters.push({
        OR: ['name', 'email'].map(field => ({
          user: {
            [field]: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }))
      })
    }

    if (cursorWhere) {
      andFilters.push(cursorWhere)
    }

    const items = await this.getClient(tx).membership.findMany({
      where: {
        AND: andFilters
      },
      include: membershipInclude,
      orderBy: [
        {
          createdAt: 'desc'
        },
        {
          id: 'desc'
        }
      ],
      take: limit + 1
    })

    const { normalizedItems, hasNextPage, nextCursor } = buildCursorPageResult({
      items,
      limit,
      getCursorPayload: item => ({
        id: item.id,
        createdAt: item.createdAt.toISOString()
      })
    })

    return {
      items: normalizedItems,
      hasNextPage,
      nextCursor
    }
  }

  async updateRole(id: string, role: Prisma.MembershipUpdateInput['role'], tx?: Prisma.TransactionClient) {
    return this.getClient(tx).membership.update({
      where: { id },
      data: { role },
      include: membershipInclude
    })
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).membership.delete({
      where: { id }
    })
  }
}
