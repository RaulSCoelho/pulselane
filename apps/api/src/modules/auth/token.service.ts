import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_DAYS,
} from './infra/auth.constants';

import { AccessTokenPayload } from './contracts/access-token-payload';
import { RefreshTokenPayload } from './contracts/refresh-token-payload';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: { userId: string; sessionId: string }) {
    const jwtPayload: AccessTokenPayload = {
      sub: payload.userId,
      sid: payload.sessionId,
      jti: randomUUID(),
      typ: 'access',
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    return {
      token,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  async verifyAccessToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async signRefreshToken(payload: { userId: string; sessionId: string }) {
    const jwtPayload: RefreshTokenPayload = {
      sub: payload.userId,
      sid: payload.sessionId,
      typ: 'refresh',
    };

    return this.jwtService.signAsync(jwtPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
    });
  }

  async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
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
    date.setDate(date.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return date;
  }
}
