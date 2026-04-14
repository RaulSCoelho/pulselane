import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type MembershipItem = {
  id: string
  role: string
}

export function registerMembershipsDemoteSecondOwnerCase(): void {
  it('should reject demoting another owner when they are the last owner remaining besides self after concurrency lock check', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'memberships-owner-a@example.com',
      organizationName: 'Owner Count Workspace'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id

    const secondOwnerUser = await prisma.user.create({
      data: {
        name: 'Second Owner',
        email: 'memberships-owner-b@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const secondOwnerMembership = await prisma.membership.create({
      data: {
        userId: secondOwnerUser.id,
        organizationId,
        role: 'owner'
      }
    })

    await expectTyped<MembershipItem>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${secondOwnerMembership.id}/role`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      200
    )

    const updatedActorMembership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId: me.id
      }
    })

    expect(updatedActorMembership).not.toBeNull()
    expect(updatedActorMembership?.role).toBe('owner')

    const updatedSecondOwnerMembership = await prisma.membership.findUnique({
      where: {
        id: secondOwnerMembership.id
      }
    })

    expect(updatedSecondOwnerMembership).not.toBeNull()
    expect(updatedSecondOwnerMembership?.role).toBe('admin')
  })
}
