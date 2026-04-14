/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerCrossTenantTaskAssigneeForbiddenCase(): void {
  it('should reject task creation when assignee is not a member of the current organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'access-task-owner@example.com',
      organizationName: 'Task Workspace'
    })

    const { response: outsiderSignup } = await signupUser(app, {
      email: 'access-task-outsider@example.com',
      organizationName: 'Outsider Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const outsiderMe = await getCurrentUser(app, outsiderSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const clientResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/clients'), {
      accessToken: ownerSignup.body.accessToken,
      organizationId
    })
      .send({
        name: 'Task Client'
      })
      .expect(201)

    const projectResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/projects'), {
      accessToken: ownerSignup.body.accessToken,
      organizationId
    })
      .send({
        clientId: clientResponse.body.id,
        name: 'Task Project'
      })
      .expect(201)

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        projectId: projectResponse.body.id,
        title: 'Cross-tenant assignee should fail',
        assigneeUserId: outsiderMe.id
      }),
      404
    )

    expect(response.body.message).toBe('Assignee not found in this organization')
  })
}
