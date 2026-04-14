import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse, InvitationResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type InvitationPreviewResponse = {
  email: string
  status: string
  canAccept: boolean
  organizationName: string
}

export function registerInvitationRevokeCase(): void {
  it('should revoke a pending invitation and block acceptance afterwards', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'invitations-revoke-owner@example.com',
      organizationName: 'Revoke Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        email: 'invitations-revoke-invitee@example.com',
        role: 'member'
      }),
      201
    )

    const revokeResponse = await expectTyped<InvitationResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/invitations/${createInvitationResponse.body.id}/revoke`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }),
      200
    )

    expect(revokeResponse.body.status).toBe('revoked')

    const previewResponse = await expectTyped<InvitationPreviewResponse>(
      request(app.getHttpServer()).get('/api/invitations/preview').query({
        token: createInvitationResponse.body.token
      }),
      200
    )

    expect(previewResponse.body.status).toBe('revoked')
    expect(previewResponse.body.canAccept).toBe(false)

    const { response: inviteeSignup } = await signupUser(app, {
      email: 'invitations-revoke-invitee@example.com',
      organizationName: 'Invitee Revoke Workspace'
    })

    const acceptResponse = await expectTyped<ErrorResponse>(
      withAccessToken(
        request(app.getHttpServer()).post('/api/invitations/accept'),
        inviteeSignup.body.accessToken
      ).send({
        token: createInvitationResponse.body.token
      }),
      409
    )

    expect(acceptResponse.body.message).toBe('Invitation is no longer pending')
  })
}
