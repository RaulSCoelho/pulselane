import request from 'supertest'
import { expect, it } from 'vitest'

import { extractCookies, replaceCookie, signupUser } from '../../support/factories/auth.factory'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthRefreshDeviceMismatchCase(): void {
  it('should reject refresh when device cookie does not match refresh token payload', async () => {
    const { app } = await getTestContext()

    const { response } = await signupUser(app, {
      name: 'Device Mismatch User',
      email: 'auth-device-mismatch@example.com',
      password: '123456',
      organizationName: 'Auth Device Mismatch Workspace'
    })

    const cookies = extractCookies(response.headers['set-cookie'])
    const tamperedCookies = replaceCookie(cookies, 'device_id', 'tampered-device')

    const refreshResponse = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', tamperedCookies),
      401
    )

    expect(refreshResponse.body.statusCode).toBe(401)
    expect(refreshResponse.body.error).toBe('Unauthorized')
    expect(refreshResponse.body.message).toBe('Device ID mismatch')
  })
}
