import request from 'supertest'
import { expect, it } from 'vitest'

import { extractCookies, signupUser } from '../../support/factories/auth.factory'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

function getCookieByName(cookies: string[], cookieName: string) {
  return cookies.find(cookie => cookie.startsWith(`${cookieName}=`))
}

export function registerAuthConcurrentRefreshCase(): void {
  it('should allow only one successful refresh when two refresh requests race on the same session', async () => {
    const { app, prisma } = await getTestContext()

    const { response } = await signupUser(app, {
      name: 'Concurrent Refresh User',
      email: 'auth-concurrent-refresh@example.com',
      password: '123456',
      organizationName: 'Auth Concurrent Refresh Workspace'
    })

    const cookies = extractCookies(response.headers['set-cookie'])

    const [firstRefresh, secondRefresh] = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookies),
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookies)
    ])

    const statuses = [firstRefresh.status, secondRefresh.status].sort((a, b) => a - b)

    expect(statuses).toEqual([200, 401])

    const successfulRefresh = firstRefresh.status === 200 ? firstRefresh : secondRefresh
    const rotatedCookiesFromResponse = extractCookies(successfulRefresh.headers['set-cookie'])
    const rotatedRefreshCookie = getCookieByName(rotatedCookiesFromResponse, 'refresh_token')
    const deviceCookie =
      getCookieByName(rotatedCookiesFromResponse, 'device_id') ?? getCookieByName(cookies, 'device_id')

    expect(rotatedRefreshCookie).toBeDefined()
    expect(deviceCookie).toBeDefined()

    const rotatedCookies = [deviceCookie!, rotatedRefreshCookie!]

    const compromisedSessionResponse = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', rotatedCookies),
      401
    )

    expect(compromisedSessionResponse.body.message).toBe('Session compromised')

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: 'auth-concurrent-refresh@example.com'
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
