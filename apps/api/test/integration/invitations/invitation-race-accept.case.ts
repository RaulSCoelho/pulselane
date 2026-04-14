import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type { InvitationResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationRaceAcceptCase(): void {
  it('should allow only one successful acceptance when two accept requests race on the same token', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-race-accept-owner@example.com',
      organizationName: 'Race Accept Workspace'
    })

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'invitations-race-accept-invitee@example.com',
        role: 'member'
      }),
      201
    )

    const invitee = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-race-accept-invitee@example.com',
      organizationName: 'Race Accept Invitee Workspace'
    })

    const [firstAccept, secondAccept] = await Promise.all([
      withAccessToken(request(app.getHttpServer()).post('/api/invitations/accept'), invitee.accessToken).send({
        token: createInvitationResponse.body.token
      }),
      withAccessToken(request(app.getHttpServer()).post('/api/invitations/accept'), invitee.accessToken).send({
        token: createInvitationResponse.body.token
      })
    ])

    const statuses = [firstAccept.status, secondAccept.status].sort((a, b) => a - b)

    expect(statuses).toEqual([201, 409])

    const acceptedMemberships = await prisma.membership.findMany({
      where: {
        organizationId: owner.organizationId,
        userId: invitee.userId
      }
    })

    expect(acceptedMemberships).toHaveLength(1)

    const invitation = await prisma.organizationInvitation.findUnique({
      where: {
        id: createInvitationResponse.body.id
      }
    })

    expect(invitation).not.toBeNull()
    expect(invitation?.status).toBe('accepted')
  })
}
