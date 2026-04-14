import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerRejectLastOwnerRemovalCase(): void {
  it('should reject removing the last owner of the organization', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'memberships-last-owner-removal@example.com',
      organizationName: 'Last Owner Removal Workspace'
    })

    const ownerMembership = await prisma.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: owner.userId,
          organizationId: owner.organizationId
        }
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/memberships/${ownerMembership.id}`), owner),
      409
    )

    expect(response.body.message).toBe('Organization must have at least one owner')
  })
}
