import { MembershipRole } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationPlanLimitRaceCreateCase(): void {
  it('should allow only one pending invitation when two create requests race for the last remaining member slot', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-plan-race-owner@example.com',
      organizationName: 'Plan Race Workspace'
    })

    const secondUser = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-plan-race-second@example.com',
      organizationName: 'Plan Race Second Workspace'
    })

    await prisma.membership.create({
      data: {
        userId: secondUser.userId,
        organizationId: owner.organizationId,
        role: MembershipRole.member
      }
    })

    const [firstCreate, secondCreate] = await Promise.all([
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'invitations-plan-race-fourth@example.com',
        role: 'member'
      }),
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'invitations-plan-race-fifth@example.com',
        role: 'member'
      })
    ])

    const statuses = [firstCreate.status, secondCreate.status].sort((a, b) => a - b)

    expect(statuses).toEqual([201, 403])

    const pendingInvitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: owner.organizationId,
        status: 'pending'
      }
    })

    expect(pendingInvitations).toHaveLength(1)
    expect(
      ['invitations-plan-race-fourth@example.com', 'invitations-plan-race-fifth@example.com'].includes(
        pendingInvitations[0].email
      )
    ).toBe(true)
  })
}
