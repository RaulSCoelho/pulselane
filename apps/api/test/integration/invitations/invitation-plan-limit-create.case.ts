/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { MembershipRole } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationPlanLimitCreateCase(): void {
  it('should reject invitation creation when organization member plan limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-plan-limit-owner@example.com',
      organizationName: 'Plan Limit Workspace'
    })

    const secondUser = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-plan-limit-second@example.com',
      organizationName: 'Second Workspace'
    })

    const thirdUser = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-plan-limit-third@example.com',
      organizationName: 'Third Workspace'
    })

    await prisma.membership.createMany({
      data: [
        {
          userId: secondUser.userId,
          organizationId: owner.organizationId,
          role: MembershipRole.member
        },
        {
          userId: thirdUser.userId,
          organizationId: owner.organizationId,
          role: MembershipRole.viewer
        }
      ]
    })

    const response = await withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
      email: 'invitations-plan-limit-fourth@example.com',
      role: 'member'
    })

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Plan limit reached for members')

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: owner.organizationId,
        email: 'invitations-plan-limit-fourth@example.com'
      }
    })

    expect(invitations).toHaveLength(0)
  })
}
