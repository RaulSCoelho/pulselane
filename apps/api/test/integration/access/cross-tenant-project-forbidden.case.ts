/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerCrossTenantProjectForbiddenCase(): void {
  it('should reject project creation when client belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerASignup } = await signupUser(app, {
      email: 'access-project-owner-a@example.com',
      organizationName: 'Project Workspace A'
    })

    const { response: ownerBSignup } = await signupUser(app, {
      email: 'access-project-owner-b@example.com',
      organizationName: 'Project Workspace B'
    })

    const ownerAMe = await getCurrentUser(app, ownerASignup.body.accessToken)
    const ownerBMe = await getCurrentUser(app, ownerBSignup.body.accessToken)

    const organizationAId = ownerAMe.memberships[0].organization.id
    const organizationBId = ownerBMe.memberships[0].organization.id

    const clientResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/clients'), {
      accessToken: ownerBSignup.body.accessToken,
      organizationId: organizationBId
    })
      .send({
        name: 'Foreign Client'
      })
      .expect(201)

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), {
        accessToken: ownerASignup.body.accessToken,
        organizationId: organizationAId
      }).send({
        clientId: clientResponse.body.id,
        name: 'Invalid Cross-Tenant Project'
      }),
      404
    )

    expect(response.body.message).toBe('Client not found')
  })
}
