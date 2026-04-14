import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerForeignAssigneeFilterCase(): void {
  it('should reject task listing when assignee filter belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'access-task-filter-owner@example.com',
      organizationName: 'Task Filter Workspace'
    })

    const { response: outsiderSignup } = await signupUser(app, {
      email: 'access-task-filter-outsider@example.com',
      organizationName: 'Task Filter Outsider Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const outsiderMe = await getCurrentUser(app, outsiderSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/tasks').query({
          assigneeUserId: outsiderMe.id,
          limit: 10
        }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      404
    )

    expect(response.body.message).toBe('Assignee not found in this organization')
  })
}
