import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { addOrganizationMembership } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerOrganizationsRejectViewerUpdateCase(): void {
  it('should reject organization update for viewer membership', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-owner-for-viewer@example.com',
      organizationName: 'Owner Workspace'
    })

    const viewer = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-viewer@example.com',
      organizationName: 'Viewer Workspace'
    })

    await addOrganizationMembership(prisma, {
      userId: viewer.userId,
      organizationId: owner.organizationId,
      role: 'viewer'
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch('/api/organizations/current'), {
        accessToken: viewer.accessToken,
        organizationId: owner.organizationId
      }).send({
        name: 'Blocked Rename'
      }),
      403
    )

    expect(response.body.message).toBe('You do not have permission to perform this action')
  })
}
