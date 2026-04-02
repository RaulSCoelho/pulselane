import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { AccessTokenPayload } from './contracts/access-token-payload';
import { RefreshTokenPayload } from './contracts/refresh-token-payload';
import { EnvConfig } from '@/config/env.config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {}

  private get jwtAccessSecret() {
    return this.configService.getOrThrow<string>('jwtAccessSecret');
  }

  private get jwtRefreshSecret() {
    return this.configService.getOrThrow<string>('jwtRefreshSecret');
  }

  private get accessTokenTtlSeconds() {
    return this.configService.getOrThrow<number>('accessTokenTtlSeconds');
  }

  private get refreshTokenTtlDays() {
    return this.configService.getOrThrow<number>('refreshTokenTtlDays');
  }

  async signAccessToken(payload: { userId: string; sessionId: string }) {
    const jwtPayload: AccessTokenPayload = {
      sub: payload.userId,
      sid: payload.sessionId,
      jti: randomUUID(),
      typ: 'access',
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      secret: this.jwtAccessSecret,
      expiresIn: this.accessTokenTtlSeconds,
    });

    return {
      token,
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  async verifyAccessToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async signRefreshToken(payload: { userId: string; sessionId: string }) {
    return this.jwtService.signAsync(
      {
        sub: payload.userId,
        sid: payload.sessionId,
        typ: 'refresh',
      } satisfies RefreshTokenPayload,
      {
        secret: this.jwtRefreshSecret,
        expiresIn: `${this.refreshTokenTtlDays}d`,
      },
    );
  }

  async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async hash(value: string) {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(value, 10);
  }

  async compare(value: string, hash: string) {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(value, hash);
  }

  generateDeviceId() {
    return randomUUID();
  }

  getRefreshExpiresAt() {
    const date = new Date();
    date.setDate(date.getDate() + this.refreshTokenTtlDays);
    return date;
  }
}
