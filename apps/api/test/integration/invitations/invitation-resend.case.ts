import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, EmailDeliveryResponse, InvitationResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationResendCase(): void {
  it('should resend a pending invitation and create another email delivery', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'invitations-resend-owner@example.com',
      organizationName: 'Pulselane Resend Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        email: 'invitations-resend-invitee@example.com',
        role: 'member'
      }),
      201
    )

    const originalToken = createInvitationResponse.body.token

    const resendResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post(`/api/invitations/${createInvitationResponse.body.id}/resend`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }),
      201
    )

    expect(resendResponse.body.status).toBe('pending')
    expect(resendResponse.body.token).toBeDefined()
    expect(resendResponse.body.token).not.toBe(originalToken)

    const emailDeliveriesResponse = await expectTyped<CursorPageResponse<EmailDeliveryResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/email-deliveries').query({ limit: 10 }), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }),
      200
    )

    expect(emailDeliveriesResponse.body.items).toHaveLength(2)
    expect(emailDeliveriesResponse.body.meta.limit).toBe(10)
    expect(emailDeliveriesResponse.body.meta.hasNextPage).toBe(false)
    expect(emailDeliveriesResponse.body.meta.nextCursor).toBeNull()
    expect(emailDeliveriesResponse.body.items[0].to).toBe('invitations-resend-invitee@example.com')
    expect(emailDeliveriesResponse.body.items[1].to).toBe('invitations-resend-invitee@example.com')
  })
}
