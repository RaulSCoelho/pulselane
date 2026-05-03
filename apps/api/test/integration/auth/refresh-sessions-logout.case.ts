import request from 'supertest'
import { expect, it } from 'vitest'

import { extractCookies, signupUser } from '../../support/factories/auth.factory'
import { withAccessToken } from '../../support/http/request-helpers'
import type { ErrorResponse, SessionResponse, TokenResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthRefreshSessionsLogoutCase(): void {
  it('should refresh token, list sessions and revoke current session on logout', async () => {
    const { app, prisma } = await getTestContext()
    const refreshedClientIp = '198.51.100.24'

    const { response } = await signupUser(app, {
      name: 'Session User',
      email: 'auth-session-user@example.com',
      password: '123456',
      organizationName: 'Auth Session Workspace'
    })

    const initialAccessToken = response.body.accessToken
    const initialCookies = extractCookies(response.headers['set-cookie'])

    expect(initialAccessToken).toBeTypeOf('string')
    expect(initialCookies.length).toBeGreaterThan(0)

    const refreshResponse = await expectTyped<TokenResponse>(
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', initialCookies)
        .set('x-forwarded-for', refreshedClientIp),
      200
    )

    expect(refreshResponse.body.accessToken).toBeTypeOf('string')
    expect(refreshResponse.body.expiresIn).toBeTypeOf('number')

    const refreshedAccessToken = refreshResponse.body.accessToken

    const sessionsResponse = await expectTyped<SessionResponse[]>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/sessions'), refreshedAccessToken),
      200
    )

    expect(Array.isArray(sessionsResponse.body)).toBe(true)
    expect(sessionsResponse.body).toHaveLength(1)
    expect(sessionsResponse.body[0].isCurrent).toBe(true)
    expect(sessionsResponse.body[0].isActive).toBe(true)
    expect(sessionsResponse.body[0].deviceId).toBeTypeOf('string')
    expect(sessionsResponse.body[0].ipAddress).toBe(refreshedClientIp)

    await expectTyped<{ success: true }>(
      withAccessToken(request(app.getHttpServer()).post('/api/auth/logout'), refreshedAccessToken),
      200
    )

    await expectTyped<ErrorResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), refreshedAccessToken),
      401
    )

    const user = await prisma.user.findUnique({
      where: {
        email: 'auth-session-user@example.com'
      },
      include: {
        authSessions: true
      }
    })

    expect(user).not.toBeNull()
    expect(user?.authSessions).toHaveLength(1)
    expect(user?.authSessions[0].revokedAt).not.toBeNull()
  })
}
