import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerOwnerSelfDemotionCase(): void {
  it('should forbid owner from removing own owner role', async () => {
    const { app } = await getTestContext()

    const { response: signup } = await signupUser(app, {
      email: 'access-self-owner@example.com',
      organizationName: 'Owner Workspace'
    })

    const me = await getCurrentUser(app, signup.body.accessToken)
    const organizationId = me.memberships[0].organization.id
    const ownerMembershipId = me.memberships[0].id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${ownerMembershipId}/role`), {
        accessToken: signup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      403
    )

    expect(response.body.message).toBe('Owner cannot remove own owner role')
  })
}
