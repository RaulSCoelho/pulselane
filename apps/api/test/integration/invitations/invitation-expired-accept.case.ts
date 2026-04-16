import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse, InvitationResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationExpiredAcceptCase(): void {
  it('should persist invitation as expired when accepting an already expired pending invitation', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-expired-owner@example.com',
      organizationName: 'Expired Invitation Workspace'
    })

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'invitations-expired-invitee@example.com',
        role: 'member'
      }),
      201
    )

    await prisma.organizationInvitation.update({
      where: {
        id: createInvitationResponse.body.id
      },
      data: {
        expiresAt: new Date(Date.now() - 60_000)
      }
    })

    const invitee = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-expired-invitee@example.com',
      organizationName: 'Invitee Secondary Workspace'
    })

    const acceptResponse = await expectTyped<ErrorResponse>(
      withAccessToken(request(app.getHttpServer()).post('/api/invitations/accept'), invitee.accessToken).send({
        token: createInvitationResponse.body.token
      }),
      409
    )

    expect(acceptResponse.body.statusCode).toBe(409)
    expect(acceptResponse.body.message).toBe('Invitation has expired')

    const persistedInvitation = await prisma.organizationInvitation.findUnique({
      where: {
        id: createInvitationResponse.body.id
      }
    })

    expect(persistedInvitation).not.toBeNull()
    expect(persistedInvitation?.status).toBe('expired')
    expect(persistedInvitation?.acceptedAt).toBeNull()
  })
}
