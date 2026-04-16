import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthSession, Prisma } from '@prisma/client'

import { CryptoService } from '../../infra/crypto/crypto.service'
import { SessionRepository } from './session.repository'
import { TokenService } from './token.service'

type CreateSessionParams = {
  userId: string
  refreshToken: string
  deviceId?: string
  userAgent?: string | null
  ipAddress?: string | null
}

type RotateSessionParams = {
  sessionId: string
  userId: string
  deviceId: string
  refreshToken: string
  newRefreshToken: string
  userAgent?: string | null
  ipAddress?: string | null
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly cryptoService: CryptoService
  ) {}

  async upsert(params: CreateSessionParams) {
    const deviceId = params.deviceId ?? this.tokenService.generateDeviceId()
    const refreshTokenHash = this.cryptoService.hashToken(params.refreshToken)
    const expiresAt = this.tokenService.getRefreshExpiresAt()

    return this.sessionRepository.upsert({
      userId: params.userId,
      deviceId,
      refreshTokenHash,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      expiresAt
    })
  }

  async rotate(params: RotateSessionParams): Promise<AuthSession> {
    return this.prisma.$transaction(async tx => {
      await this.acquireSessionLock(params.sessionId, tx)

      const session = await this.validateSession(
        params.userId,
        params.sessionId,
        {
          deviceId: params.deviceId,
          refreshToken: params.refreshToken
        },
        tx
      )

      const newRefreshTokenHash = this.cryptoService.hashToken(params.newRefreshToken)

      return this.sessionRepository.updateById(
        session.id,
        {
          refreshTokenHash: newRefreshTokenHash,
          userAgent: params.userAgent ?? session.userAgent,
          ipAddress: params.ipAddress ?? session.ipAddress,
          expiresAt: this.tokenService.getRefreshExpiresAt(),
          lastUsedAt: new Date()
        },
        tx
      )
    })
  }

  async findManyByUserId(userId: string) {
    return this.sessionRepository.findManyByUserId(userId)
  }

  async findById(sessionId: string) {
    return this.sessionRepository.findById(sessionId)
  }

  async revokeById(sessionId: string, userId: string) {
    return this.sessionRepository.revokeById(sessionId, userId)
  }

  async revokeByDevice(userId: string, deviceId: string) {
    return this.sessionRepository.revokeByDevice(userId, deviceId)
  }

  async revokeAllByUserId(userId: string) {
    return this.sessionRepository.revokeAllByUserId(userId)
  }

  async validateSession(
    userId: string,
    sessionId: string,
    options?: {
      refreshToken?: string
      deviceId?: string
    },
    tx?: Prisma.TransactionClient
  ) {
    const session = await this.sessionRepository.findById(sessionId, tx)

    if (!session) {
      throw new UnauthorizedException('Session not found')
    }

    if (session.userId !== userId) {
      throw new UnauthorizedException('Invalid session')
    }

    if (session.compromisedAt) {
      throw new UnauthorizedException('Session compromised')
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session revoked')
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionRepository.updateById(session.id, {
        revokedAt: new Date()
      })

      throw new UnauthorizedException('Session expired')
    }

    if (options?.deviceId && session.deviceId !== options.deviceId) {
      await this.sessionRepository.updateById(session.id, {
        revokedAt: new Date(),
        compromisedAt: new Date()
      })

      throw new UnauthorizedException('Invalid device')
    }

    if (options?.refreshToken) {
      const isValid = this.cryptoService.compareToken(options.refreshToken, session.refreshTokenHash)

      if (!isValid) {
        await this.sessionRepository.updateById(session.id, {
          revokedAt: new Date(),
          compromisedAt: new Date()
        })

        throw new UnauthorizedException('Invalid refresh token')
      }
    }

    return session
  }

  private async acquireSessionLock(sessionId: string, tx: Prisma.TransactionClient) {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`auth-session:${sessionId}`}))
    `
  }
}
