/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerForeignClientFilterCase(): void {
  it('should reject project listing when client filter belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerASignup } = await signupUser(app, {
      email: 'access-project-filter-a@example.com',
      organizationName: 'Project Filter Workspace A'
    })

    const { response: ownerBSignup } = await signupUser(app, {
      email: 'access-project-filter-b@example.com',
      organizationName: 'Project Filter Workspace B'
    })

    const ownerAMe = await getCurrentUser(app, ownerASignup.body.accessToken)
    const ownerBMe = await getCurrentUser(app, ownerBSignup.body.accessToken)

    const organizationAId = ownerAMe.memberships[0].organization.id
    const organizationBId = ownerBMe.memberships[0].organization.id

    const foreignClientResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/clients'), {
      accessToken: ownerBSignup.body.accessToken,
      organizationId: organizationBId
    })
      .send({
        name: 'Foreign Filter Client'
      })
      .expect(201)

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/projects').query({
          clientId: foreignClientResponse.body.id,
          limit: 10
        }),
        {
          accessToken: ownerASignup.body.accessToken,
          organizationId: organizationAId
        }
      ),
      404
    )

    expect(response.body.message).toBe('Client not found')
  })
}
