import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { DEVICE_COOKIE_NAME, REFRESH_COOKIE_NAME } from './auth.constants';
import { EnvConfig } from '@/config/env.config';

@Injectable()
export class CookieService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  private get cookieSecure(): boolean {
    return this.configService.getOrThrow('cookieSecure', { infer: true });
  }

  private get cookieSameSite(): 'lax' | 'none' {
    return this.configService.getOrThrow('cookieSameSite', { infer: true });
  }

  private get cookieDomain(): string | undefined {
    return this.configService.get('cookieDomain', { infer: true });
  }

  private get refreshMaxAgeSeconds(): number {
    return (
      this.configService.getOrThrow('refreshTokenTtlDays', { infer: true }) *
      24 *
      60 *
      60
    );
  }

  setRefreshCookie(reply: FastifyReply, refreshToken: string) {
    reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      // Keeping the refresh cookie under /api/auth narrows where browsers send it.
      path: '/api/auth',
      domain: this.cookieDomain,
      maxAge: this.refreshMaxAgeSeconds,
    });
  }

  clearRefreshCookie(reply: FastifyReply) {
    reply.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/api/auth',
      domain: this.cookieDomain,
    });
  }

  setDeviceCookie(reply: FastifyReply, deviceId: string) {
    reply.setCookie(DEVICE_COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      // The device cookie must be visible to all routes because refresh and
      // access-protected flows both rely on the same device binding.
      path: '/',
      domain: this.cookieDomain,
      maxAge: this.refreshMaxAgeSeconds,
    });
  }

  clearDeviceCookie(reply: FastifyReply) {
    reply.clearCookie(DEVICE_COOKIE_NAME, {
      path: '/',
      domain: this.cookieDomain,
    });
  }
}
