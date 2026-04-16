import request from 'supertest'
import { expect, it } from 'vitest'

import { withAccessToken } from '../../support/http/request-helpers'
import type { CurrentUserResponse, TokenResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthConcurrentSignupSameOrgNameCase(): void {
  it('should create unique organization slugs when two signups race with the same organization name', async () => {
    const { app } = await getTestContext()

    const [firstSignupResponse, secondSignupResponse] = await Promise.all([
      expectTyped<TokenResponse>(
        request(app.getHttpServer()).post('/api/auth/signup').send({
          name: 'Concurrent Signup User 1',
          email: 'auth-concurrent-signup-org-1@example.com',
          password: '123456',
          organizationName: 'Concurrent Signup Workspace'
        }),
        201
      ),
      expectTyped<TokenResponse>(
        request(app.getHttpServer()).post('/api/auth/signup').send({
          name: 'Concurrent Signup User 2',
          email: 'auth-concurrent-signup-org-2@example.com',
          password: '123456',
          organizationName: 'Concurrent Signup Workspace'
        }),
        201
      )
    ])

    const firstMeResponse = await expectTyped<CurrentUserResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), firstSignupResponse.body.accessToken),
      200
    )

    const secondMeResponse = await expectTyped<CurrentUserResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), secondSignupResponse.body.accessToken),
      200
    )

    const firstOrganization = firstMeResponse.body.memberships[0].organization
    const secondOrganization = secondMeResponse.body.memberships[0].organization

    expect(firstOrganization.name).toBe('Concurrent Signup Workspace')
    expect(secondOrganization.name).toBe('Concurrent Signup Workspace')

    expect(firstOrganization.slug).not.toBe(secondOrganization.slug)
    expect([firstOrganization.slug, secondOrganization.slug]).toContain('concurrent-signup-workspace')
    expect([firstOrganization.slug, secondOrganization.slug]).toContain('concurrent-signup-workspace-1')
  })
}
