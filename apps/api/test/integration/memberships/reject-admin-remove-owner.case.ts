import { MembershipRole } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerRejectAdminRemoveOwnerCase(): void {
  it('should reject admin trying to remove an owner membership', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'memberships-remove-owner-target@example.com',
      organizationName: 'Owner Protected Workspace'
    })

    const adminUser = await createAuthenticatedUser(app, prisma, {
      email: 'memberships-remove-admin-actor@example.com',
      organizationName: 'Admin Secondary Workspace'
    })

    await prisma.membership.create({
      data: {
        organizationId: owner.organizationId,
        userId: adminUser.userId,
        role: MembershipRole.admin
      }
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
      withOrgAuth(request(app.getHttpServer()).delete(`/api/memberships/${ownerMembership.id}`), {
        accessToken: adminUser.accessToken,
        organizationId: owner.organizationId
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot remove owner memberships')
  })
}
