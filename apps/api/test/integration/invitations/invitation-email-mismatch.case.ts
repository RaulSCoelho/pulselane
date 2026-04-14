import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse, InvitationResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationEmailMismatchCase(): void {
  it('should reject invitation acceptance when authenticated user email does not match invitation email', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'invitations-mismatch-owner@example.com',
      organizationName: 'Mismatch Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        email: 'invitations-mismatch-expected@example.com',
        role: 'member'
      }),
      201
    )

    const { response: otherUserSignup } = await signupUser(app, {
      email: 'invitations-mismatch-different@example.com',
      organizationName: 'Different Workspace'
    })

    const response = await expectTyped<ErrorResponse>(
      withAccessToken(
        request(app.getHttpServer()).post('/api/invitations/accept'),
        otherUserSignup.body.accessToken
      ).send({
        token: createInvitationResponse.body.token
      }),
      403
    )

    expect(response.body.message).toBe('You can only accept invitations sent to your own email')
  })
}
