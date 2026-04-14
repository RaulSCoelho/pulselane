import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerCrossTenantClientForbiddenCase(): void {
  it('should forbid access when x-organization-id belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: firstUserSignup } = await signupUser(app, {
      email: 'access-tenant-user-1@example.com',
      organizationName: 'Tenant Workspace One'
    })

    const { response: secondUserSignup } = await signupUser(app, {
      email: 'access-tenant-user-2@example.com',
      organizationName: 'Tenant Workspace Two'
    })

    const secondUserMe = await getCurrentUser(app, secondUserSignup.body.accessToken)
    const secondOrganizationId = secondUserMe.memberships[0].organization.id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients'), {
        accessToken: firstUserSignup.body.accessToken,
        organizationId: secondOrganizationId
      }),
      403
    )

    expect(response.body.message).toBe('User is not a member of this organization')
  })
}
