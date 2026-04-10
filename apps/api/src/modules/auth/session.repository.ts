import { PrismaService } from '@/infra/prisma/prisma.service';
import { removeUndefinedFields } from '@/common/utils/remove-undefined';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type CreateSessionInput = {
  userId: string;
  deviceId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
};

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: CreateSessionInput) {
    return this.prisma.authSession.upsert({
      where: {
        userId_deviceId: {
          userId: input.userId,
          deviceId: input.deviceId,
        },
      },
      update: removeUndefinedFields({
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        // Reusing a device should reactivate the session with the newest token
        // and request metadata rather than leaving stale compromise flags behind.
        lastUsedAt: new Date(),
        revokedAt: null,
        compromisedAt: null,
      }),
      create: {
        userId: input.userId,
        deviceId: input.deviceId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        lastUsedAt: new Date(),
      },
    });
  }

  async updateById(id: string, data: Prisma.AuthSessionUpdateInput) {
    return this.prisma.authSession.update({
      where: { id },
      data,
    });
  }

  async findManyByUserId(userId: string) {
    return this.prisma.authSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.authSession.findUnique({ where: { id } });
  }

  async findByUserAndDevice(userId: string, deviceId: string) {
    return this.prisma.authSession.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });
  }

  async revokeById(sessionId: string, userId: string) {
    return this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllByUserId(userId: string) {
    return this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeByDevice(userId: string, deviceId: string) {
    return this.prisma.authSession.updateMany({
      where: {
        userId,
        deviceId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async deleteById(id: string) {
    return this.prisma.authSession.delete({ where: { id } });
  }
}
