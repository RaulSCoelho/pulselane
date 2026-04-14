import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser, getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerMembershipsRejectAdminPromoteOwnerCase(): void {
  it('should reject admin promoting a membership to owner', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'memberships-owner-promote@example.com',
      organizationName: 'Admin Promote Workspace'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'memberships-admin-promote@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const memberUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'memberships-member-promote@example.com',
        passwordHash: 'hashed-password'
      }
    })

    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        organizationId,
        role: 'admin'
      }
    })

    const memberMembership = await prisma.membership.create({
      data: {
        userId: memberUser.id,
        organizationId,
        role: 'member'
      }
    })

    const adminLogin = await createAuthenticatedUser(app, prisma, {
      email: 'memberships-admin-promote-login@example.com',
      organizationName: 'Temporary Workspace'
    })

    await prisma.membership.deleteMany({
      where: {
        userId: adminLogin.userId
      }
    })

    await prisma.membership.create({
      data: {
        userId: adminLogin.userId,
        organizationId,
        role: 'admin'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${memberMembership.id}/role`), {
        accessToken: adminLogin.accessToken,
        organizationId
      }).send({
        role: 'owner'
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot assign owner role')
  })
}
