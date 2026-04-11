import { removeUndefinedFields } from '@/common/utils/remove-undefined'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

type CreateSessionInput = {
  userId: string
  deviceId: string
  refreshTokenHash: string
  userAgent?: string | null
  ipAddress?: string | null
  expiresAt: Date
}

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma
  }

  async upsert(input: CreateSessionInput, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.upsert({
      where: {
        userId_deviceId: {
          userId: input.userId,
          deviceId: input.deviceId
        }
      },
      update: removeUndefinedFields({
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        lastUsedAt: new Date(),
        revokedAt: null,
        compromisedAt: null
      }),
      create: {
        userId: input.userId,
        deviceId: input.deviceId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        lastUsedAt: new Date()
      }
    })
  }

  async updateById(id: string, data: Prisma.AuthSessionUpdateInput, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.update({
      where: { id },
      data
    })
  }

  async findManyByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.findUnique({
      where: { id }
    })
  }

  async findByUserAndDevice(userId: string, deviceId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    })
  }

  async revokeById(sessionId: string, userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
  }

  async revokeAllByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
  }

  async revokeByDevice(userId: string, deviceId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.updateMany({
      where: {
        userId,
        deviceId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
  }

  async deleteById(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authSession.delete({
      where: { id }
    })
  }
}
