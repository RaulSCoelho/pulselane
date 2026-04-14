import request from 'supertest'
import { expect, it } from 'vitest'

import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerUnauthenticatedOrgRouteCase(): void {
  it('should reject unauthenticated access to organization-scoped route', async () => {
    const { app } = await getTestContext()

    const response = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).get('/api/clients').set('x-organization-id', 'some-org-id'),
      401
    )

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
  })
}
