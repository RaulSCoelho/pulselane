import request from 'supertest'
import { expect, it } from 'vitest'

import { signupUser } from '../../support/factories/auth.factory'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthInvalidLoginCase(): void {
  it('should reject login with invalid credentials', async () => {
    const { app } = await getTestContext()

    await signupUser(app, {
      name: 'Login User',
      email: 'auth-login-user@example.com',
      password: '123456',
      organizationName: 'Auth Login Workspace'
    })

    const response = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'auth-login-user@example.com',
        password: 'wrong-password'
      }),
      401
    )

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
    expect(response.body.message).toBe('Invalid credentials')
  })
}
