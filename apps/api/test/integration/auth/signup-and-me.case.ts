import type { SignupDto } from '@/modules/auth/dto/requests/signup.dto'
import request from 'supertest'
import { expect, it } from 'vitest'

import { withAccessToken } from '../../support/http/request-helpers'
import type { CurrentUserResponse, TokenResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthSignupAndMeCase(): void {
  it('should signup, create organization membership and return current user', async () => {
    const { app } = await getTestContext()

    const payload: SignupDto = {
      name: 'Raul',
      email: 'auth-signup-me@example.com',
      password: '123456',
      organizationName: 'Auth Signup Workspace'
    }

    const signupResponse = await expectTyped<TokenResponse>(
      request(app.getHttpServer()).post('/api/auth/signup').send(payload),
      201
    )

    expect(signupResponse.body.accessToken).toBeTypeOf('string')
    expect(signupResponse.headers['set-cookie']).toBeTruthy()

    const meResponse = await expectTyped<CurrentUserResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), signupResponse.body.accessToken),
      200
    )

    expect(meResponse.body.email).toBe('auth-signup-me@example.com')
    expect(meResponse.body.memberships).toHaveLength(1)
    expect(meResponse.body.memberships[0].role).toBe('owner')
    expect(meResponse.body.memberships[0].organization.name).toBe('Auth Signup Workspace')
  })
}
