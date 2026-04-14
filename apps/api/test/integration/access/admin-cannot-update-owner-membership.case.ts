import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAdminCannotUpdateOwnerMembershipCase(): void {
  it('should forbid admin from updating an owner membership', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'access-membership-owner@example.com',
      organizationName: 'Membership Workspace'
    })

    const { response: adminSignup } = await signupUser(app, {
      email: 'access-membership-admin@example.com',
      organizationName: 'Membership Admin Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const adminMe = await getCurrentUser(app, adminSignup.body.accessToken)

    const organizationId = ownerMe.memberships[0].organization.id
    const ownerMembershipId = ownerMe.memberships[0].id

    await prisma.membership.create({
      data: {
        userId: adminMe.id,
        organizationId,
        role: 'admin'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${ownerMembershipId}/role`), {
        accessToken: adminSignup.body.accessToken,
        organizationId
      }).send({
        role: 'member'
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot update owner memberships')
  })
}
