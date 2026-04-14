import request from 'supertest'
import { expect, it } from 'vitest'

import { extractCookies, signupUser } from '../../support/factories/auth.factory'
import { getTestContext } from '../../support/runtime/test-context'

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

    const user = await prisma.user.findUnique({
      where: {
        email: 'auth-concurrent-refresh@example.com'
      },
      include: {
        authSessions: true
      }
    })

    expect(user).not.toBeNull()
    expect(user?.authSessions).toHaveLength(1)
  })
}
