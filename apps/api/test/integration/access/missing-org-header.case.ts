import request from 'supertest'
import { expect, it } from 'vitest'

import { signupUser } from '../../support/factories/auth.factory'
import { withAccessToken } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerMissingOrganizationHeaderCase(): void {
  it('should reject organization-scoped route without x-organization-id header', async () => {
    const { app } = await getTestContext()

    const { response: signup } = await signupUser(app, {
      email: 'access-missing-header@example.com',
      organizationName: 'Header Workspace'
    })

    const response = await expectTyped<ErrorResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/clients'), signup.body.accessToken),
      400
    )

    expect(response.body.statusCode).toBe(400)
    expect(response.body.error).toBe('Bad Request')
    expect(response.body.message).toBe('x-organization-id header is required')
  })
}
