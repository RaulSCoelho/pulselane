import request from 'supertest'
import { expect, it } from 'vitest'

import { extractCookies, signupUser } from '../../support/factories/auth.factory'
import type { ErrorResponse, TokenResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

function getCookieByName(cookies: string[], cookieName: string) {
  return cookies.find(cookie => cookie.startsWith(`${cookieName}=`))
}

export function registerAuthRefreshTokenReuseCompromisesSessionCase(): void {
  it('should compromise the session when an already-rotated refresh token is reused', async () => {
    const { app, prisma } = await getTestContext()

    const { response } = await signupUser(app, {
      name: 'Refresh Reuse User',
      email: 'auth-refresh-reuse@example.com',
      password: '123456',
      organizationName: 'Refresh Reuse Workspace'
    })

    const initialCookies = extractCookies(response.headers['set-cookie'])

    const initialDeviceCookie = getCookieByName(initialCookies, 'device_id')
    expect(initialDeviceCookie).toBeDefined()

    const firstRefresh = await expectTyped<TokenResponse>(
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', initialCookies),
      200
    )

    const rotatedCookiesFromResponse = extractCookies(firstRefresh.headers['set-cookie'])
    const rotatedRefreshCookie = getCookieByName(rotatedCookiesFromResponse, 'refresh_token')

    expect(rotatedRefreshCookie).toBeDefined()

    const rotatedCookies = [initialDeviceCookie!, rotatedRefreshCookie!]

    const reuseResponse = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', initialCookies),
      401
    )

    expect(reuseResponse.body.message).toBe('Invalid refresh token')

    const sessionCompromisedResponse = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', rotatedCookies),
      401
    )

    expect(sessionCompromisedResponse.body.message).toBe('Session compromised')

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: 'auth-refresh-reuse@example.com'
      },
      include: {
        authSessions: true
      }
    })

    expect(user.authSessions).toHaveLength(1)
    expect(user.authSessions[0].compromisedAt).not.toBeNull()
    expect(user.authSessions[0].revokedAt).not.toBeNull()
  })
}
