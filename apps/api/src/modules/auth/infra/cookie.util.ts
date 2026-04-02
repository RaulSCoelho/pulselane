import { FastifyReply } from 'fastify';

import {
  DEVICE_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_DAYS,
} from './auth.constants';

function getCookieDomain(): string | undefined {
  const domain = process.env.APP_COOKIE_DOMAIN?.trim();

  if (!domain) {
    return undefined;
  }

  return domain;
}

export function setRefreshCookie(reply: FastifyReply, refreshToken: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    domain: getCookieDomain(),
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    path: '/api/auth',
    domain: getCookieDomain(),
  });
}

export function setDeviceCookie(reply: FastifyReply, deviceId: string) {
  reply.setCookie(DEVICE_COOKIE_NAME, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: getCookieDomain(),
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearDeviceCookie(reply: FastifyReply) {
  reply.clearCookie(DEVICE_COOKIE_NAME, {
    path: '/',
    domain: getCookieDomain(),
  });
}
