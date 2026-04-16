import request from 'supertest'
import { expect, it } from 'vitest'

import { waitForSentEmailDeliveries } from '../../support/email/wait-for-email-deliveries'
import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type {
  CursorPageResponse,
  CurrentUserResponse,
  EmailDeliveryResponse,
  InvitationResponse
} from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type InvitationPreviewResponse = {
  email: string
  status: string
  canAccept: boolean
  organizationName: string
}

export function registerInvitationsFullFlowCase(): void {
  it('should create, preview, paginate and accept invitations with cursor-based responses', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'invitations-flow-owner@example.com',
      organizationName: 'Pulselane Labs'
    })

    const ownerAccessToken = ownerSignup.body.accessToken

    const ownerMe = await getCurrentUser(app, ownerAccessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const firstInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerAccessToken,
        organizationId
      }).send({
        email: 'invitations-flow-invitee@example.com',
        role: 'member'
      }),
      201
    )

    expect(firstInvitationResponse.body.email).toBe('invitations-flow-invitee@example.com')
    expect(firstInvitationResponse.body.status).toBe('pending')
    expect(firstInvitationResponse.body.token).toBeDefined()

    const secondInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerAccessToken,
        organizationId
      }).send({
        email: 'invitations-flow-second-invitee@example.com',
        role: 'viewer'
      }),
      201
    )

    expect(secondInvitationResponse.body.email).toBe('invitations-flow-second-invitee@example.com')
    expect(secondInvitationResponse.body.status).toBe('pending')
    expect(secondInvitationResponse.body.token).toBeDefined()

    const previewResponse = await expectTyped<InvitationPreviewResponse>(
      request(app.getHttpServer()).get('/api/invitations/preview').query({
        token: firstInvitationResponse.body.token
      }),
      200
    )

    expect(previewResponse.body.email).toBe('invitations-flow-invitee@example.com')
    expect(previewResponse.body.status).toBe('pending')
    expect(previewResponse.body.canAccept).toBe(true)
    expect(previewResponse.body.organizationName).toBe('Pulselane Labs')

    await waitForSentEmailDeliveries({
      app,
      accessToken: ownerAccessToken,
      organizationId,
      expectedCount: 2
    })

    const emailDeliveriesFirstPage = await expectTyped<CursorPageResponse<EmailDeliveryResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/email-deliveries').query({ limit: 1 }), {
        accessToken: ownerAccessToken,
        organizationId
      }),
      200
    )

    expect(emailDeliveriesFirstPage.body.items).toHaveLength(1)
    expect(emailDeliveriesFirstPage.body.meta.limit).toBe(1)
    expect(emailDeliveriesFirstPage.body.meta.hasNextPage).toBe(true)
    expect(emailDeliveriesFirstPage.body.meta.nextCursor).toBeTypeOf('string')
    expect(emailDeliveriesFirstPage.body.items[0].organizationId).toBe(organizationId)
    expect(emailDeliveriesFirstPage.body.items[0].sentBy).toBe(ownerMe.id)
    expect(emailDeliveriesFirstPage.body.items[0].sender?.email).toBe('invitations-flow-owner@example.com')
    expect(emailDeliveriesFirstPage.body.items[0].status).toBe('sent')
    expect((emailDeliveriesFirstPage.body.items[0].metadata as { type?: string })?.type).toBe('organization_invitation')

    const emailDeliveriesSecondPage = await expectTyped<CursorPageResponse<EmailDeliveryResponse>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/email-deliveries')
          .query({
            limit: 1,
            cursor: emailDeliveriesFirstPage.body.meta.nextCursor ?? ''
          }),
        {
          accessToken: ownerAccessToken,
          organizationId
        }
      ),
      200
    )

    expect(emailDeliveriesSecondPage.body.items).toHaveLength(1)
    expect(emailDeliveriesSecondPage.body.meta.hasNextPage).toBe(false)
    expect(emailDeliveriesSecondPage.body.meta.nextCursor).toBeNull()

    const invitationsFirstPage = await expectTyped<CursorPageResponse<InvitationResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/invitations').query({ limit: 1 }), {
        accessToken: ownerAccessToken,
        organizationId
      }),
      200
    )

    expect(invitationsFirstPage.body.items).toHaveLength(1)
    expect(invitationsFirstPage.body.meta.limit).toBe(1)
    expect(invitationsFirstPage.body.meta.hasNextPage).toBe(true)
    expect(invitationsFirstPage.body.meta.nextCursor).toBeTypeOf('string')

    const invitationsSecondPage = await expectTyped<CursorPageResponse<InvitationResponse>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/invitations')
          .query({
            limit: 1,
            cursor: invitationsFirstPage.body.meta.nextCursor ?? ''
          }),
        {
          accessToken: ownerAccessToken,
          organizationId
        }
      ),
      200
    )

    expect(invitationsSecondPage.body.items).toHaveLength(1)
    expect(invitationsSecondPage.body.meta.hasNextPage).toBe(false)
    expect(invitationsSecondPage.body.meta.nextCursor).toBeNull()

    const filteredInvitations = await expectTyped<CursorPageResponse<InvitationResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/invitations').query({
          limit: 10,
          email: 'invitations-flow-second-invitee@example.com',
          status: 'pending'
        }),
        {
          accessToken: ownerAccessToken,
          organizationId
        }
      ),
      200
    )

    expect(filteredInvitations.body.items).toHaveLength(1)
    expect(filteredInvitations.body.items[0].email).toBe('invitations-flow-second-invitee@example.com')

    const { response: inviteeSignup } = await signupUser(app, {
      email: 'invitations-flow-invitee@example.com',
      organizationName: 'Other Workspace'
    })

    const acceptResponse = await expectTyped<InvitationResponse>(
      withAccessToken(
        request(app.getHttpServer()).post('/api/invitations/accept'),
        inviteeSignup.body.accessToken
      ).send({
        token: firstInvitationResponse.body.token
      }),
      201
    )

    expect(acceptResponse.body.status).toBe('accepted')

    const inviteeMe = await expectTyped<CurrentUserResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/auth/me'), inviteeSignup.body.accessToken),
      200
    )

    expect(inviteeMe.body.memberships).toHaveLength(2)
  })
}
