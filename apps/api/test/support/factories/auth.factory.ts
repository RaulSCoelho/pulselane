import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import type { PrismaClient } from '@prisma/client'
import request from 'supertest'

import { buildSignupDto } from '../builders/request.builders'
import type { CurrentUserResponse, TokenResponse } from '../http/response.types'
import { expectTyped } from '../http/typed-response'

export type AuthenticatedTestUser = {
  accessToken: string
  userId: string
  organizationId: string
  email: string
}

export async function signupUser(app: NestFastifyApplication, overrides: Parameters<typeof buildSignupDto>[0] = {}) {
  const payload = buildSignupDto(overrides)

  const response = await expectTyped<TokenResponse>(
    request(app.getHttpServer()).post('/api/auth/signup').send(payload),
    201
  )

  return {
    payload,
    response
  }
}

export async function getCurrentUser(app: NestFastifyApplication, accessToken: string): Promise<CurrentUserResponse> {
  const response = await expectTyped<CurrentUserResponse>(
    request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`),
    200
  )

  return response.body
}

export async function createAuthenticatedUser(
  app: NestFastifyApplication,
  prisma: PrismaClient,
  overrides: Parameters<typeof buildSignupDto>[0] = {}
): Promise<AuthenticatedTestUser> {
  const { payload, response } = await signupUser(app, overrides)

  const user = await prisma.user.findUnique({
    where: {
      email: payload.email
    },
    include: {
      memberships: true
    }
  })

  if (!user || user.memberships.length === 0) {
    throw new Error('Failed to resolve created test user context')
  }

  return {
    accessToken: response.body.accessToken,
    userId: user.id,
    organizationId: user.memberships[0].organizationId,
    email: payload.email
  }
}

export function extractCookies(setCookie: string | string[] | undefined): string[] {
  if (!setCookie) {
    return []
  }

  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  return cookies.map(cookie => cookie.split(';')[0])
}

export function replaceCookie(cookies: string[], cookieName: string, cookieValue: string): string[] {
  const targetPrefix = `${cookieName}=`

  return cookies.map(cookie => (cookie.startsWith(targetPrefix) ? `${cookieName}=${cookieValue}` : cookie))
}
