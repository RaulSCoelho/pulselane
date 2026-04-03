import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthSession } from '@prisma/client';

import { SessionRepository } from './domain/session.repository';
import { TokenService } from './token.service';
import { CryptoService } from '@/infra/crypto/crypto.service';

type CreateSessionParams = {
  userId: string;
  refreshToken: string;
  deviceId?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

type RotateSessionParams = {
  sessionId: string;
  userId: string;
  deviceId: string;
  refreshToken: string;
  newRefreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly cryptoService: CryptoService,
  ) {}

  async upsert(params: CreateSessionParams) {
    const deviceId = params.deviceId ?? this.tokenService.generateDeviceId();
    const refreshTokenHash = await this.cryptoService.hash(params.refreshToken);
    const expiresAt = this.tokenService.getRefreshExpiresAt();

    return this.sessionRepository.upsert({
      userId: params.userId,
      deviceId,
      refreshTokenHash,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      expiresAt,
    });
  }

  async rotate(params: RotateSessionParams): Promise<AuthSession> {
    const session = await this.validateSession(
      params.userId,
      params.sessionId,
      { deviceId: params.deviceId, refreshToken: params.refreshToken },
    );
    const newRefreshTokenHash = await this.cryptoService.hash(
      params.newRefreshToken,
    );

    return this.sessionRepository.updateById(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      userAgent: params.userAgent ?? session.userAgent,
      ipAddress: params.ipAddress ?? session.ipAddress,
      expiresAt: this.tokenService.getRefreshExpiresAt(),
      lastUsedAt: new Date(),
    });
  }

  async findManyByUserId(userId: string) {
    return this.sessionRepository.findManyByUserId(userId);
  }

  async findById(sessionId: string) {
    return this.sessionRepository.findById(sessionId);
  }

  async revokeById(sessionId: string, userId: string) {
    return this.sessionRepository.revokeById(sessionId, userId);
  }

  async revokeByDevice(userId: string, deviceId: string) {
    return this.sessionRepository.revokeByDevice(userId, deviceId);
  }

  async revokeAllByUserId(userId: string) {
    return this.sessionRepository.revokeAllByUserId(userId);
  }

  async validateSession(
    userId: string,
    sessionId: string,
    options?: {
      refreshToken?: string;
      deviceId?: string;
    },
  ) {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.userId !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session revoked');
    }

    if (session.compromisedAt) {
      throw new UnauthorizedException('Session compromised');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionRepository.updateById(session.id, {
        revokedAt: new Date(),
      });

      throw new UnauthorizedException('Session expired');
    }

    if (options?.deviceId && session.deviceId !== options.deviceId) {
      await this.sessionRepository.updateById(session.id, {
        revokedAt: new Date(),
        compromisedAt: new Date(),
      });

      throw new UnauthorizedException('Invalid device');
    }

    if (options?.refreshToken) {
      const isValid = await this.cryptoService.compare(
        options.refreshToken,
        session.refreshTokenHash,
      );

      if (!isValid) {
        await this.sessionRepository.updateById(session.id, {
          revokedAt: new Date(),
          compromisedAt: new Date(),
        });

        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    return session;
  }
}
