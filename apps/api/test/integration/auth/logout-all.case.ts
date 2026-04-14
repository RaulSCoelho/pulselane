import request from 'supertest'
import { expect, it } from 'vitest'

import { signupUser } from '../../support/factories/auth.factory'
import { withAccessToken } from '../../support/http/request-helpers'
import type { ErrorResponse, SessionResponse, TokenResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthLogoutAllCase(): void {
  it('should create multiple sessions and revoke all of them with logout-all', async () => {
    const { app, prisma } = await getTestContext()

    await signupUser(app, {
      name: 'Multi Session User',
      email: 'auth-multi-session@example.com',
      password: '123456',
      organizationName: 'Auth Multi Session Workspace'
    })

    const firstLogin = await expectTyped<TokenResponse>(
      request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'auth-multi-session@example.com',
        password: '123456'
      }),
      200
    )

    const secondLogin = await expectTyped<TokenResponse>(
      request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'auth-multi-session@example.com',
        password: '123456'
      }),
      200
    )

    const firstAccessToken = firstLogin.body.accessToken
    const secondAccessToken = secondLogin.body.accessToken

    const sessionsBeforeLogoutAll = await expectTyped<SessionResponse[]>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/sessions'), firstAccessToken),
      200
    )

    expect(sessionsBeforeLogoutAll.body).toHaveLength(3)

    await expectTyped<{ success: true }>(
      withAccessToken(request(app.getHttpServer()).post('/api/auth/logout-all'), firstAccessToken),
      200
    )

    await expectTyped<ErrorResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), firstAccessToken),
      401
    )

    await expectTyped<ErrorResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), secondAccessToken),
      401
    )

    const user = await prisma.user.findUnique({
      where: {
        email: 'auth-multi-session@example.com'
      },
      include: {
        authSessions: true
      }
    })

    expect(user).not.toBeNull()
    expect(user?.authSessions).toHaveLength(3)
    expect(user?.authSessions.every(session => session.revokedAt !== null)).toBe(true)
  })
}
