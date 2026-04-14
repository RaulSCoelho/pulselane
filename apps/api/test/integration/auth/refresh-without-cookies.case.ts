import request from 'supertest'
import { expect, it } from 'vitest'

import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuthRefreshWithoutCookiesCase(): void {
  it('should reject refresh without cookies', async () => {
    const { app } = await getTestContext()

    const response = await expectTyped<ErrorResponse>(request(app.getHttpServer()).post('/api/auth/refresh'), 401)

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
  })
}
