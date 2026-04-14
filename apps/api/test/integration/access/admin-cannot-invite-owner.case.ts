import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAdminCannotInviteOwnerCase(): void {
  it('should forbid admin from inviting an owner', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'access-invite-owner@example.com',
      organizationName: 'Invitations Workspace'
    })

    const { response: adminSignup } = await signupUser(app, {
      email: 'access-invite-admin@example.com',
      organizationName: 'Admin Personal Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const adminMe = await getCurrentUser(app, adminSignup.body.accessToken)

    const organizationId = ownerMe.memberships[0].organization.id

    await prisma.membership.create({
      data: {
        userId: adminMe.id,
        organizationId,
        role: 'admin'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: adminSignup.body.accessToken,
        organizationId
      }).send({
        email: 'access-new-owner@example.com',
        role: 'owner'
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot invite owners')
  })
}
