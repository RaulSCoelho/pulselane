import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createAuthenticatedUser, getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type {
  CursorPageResponse,
  CurrentUserResponse,
  EmailDeliveryResponse,
  ErrorResponse,
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

describe('Invitations integration', () => {
  it('should create, preview, paginate and accept invitations with cursor-based responses', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner@example.com',
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
        email: 'invitee@example.com',
        role: 'member'
      }),
      201
    )

    expect(firstInvitationResponse.body.email).toBe('invitee@example.com')
    expect(firstInvitationResponse.body.status).toBe('pending')
    expect(firstInvitationResponse.body.token).toBeDefined()

    const secondInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerAccessToken,
        organizationId
      }).send({
        email: 'second-invitee@example.com',
        role: 'viewer'
      }),
      201
    )

    const previewResponse = await expectTyped<InvitationPreviewResponse>(
      request(app.getHttpServer()).get('/api/invitations/preview').query({
        token: firstInvitationResponse.body.token
      }),
      200
    )

    expect(previewResponse.body.email).toBe('invitee@example.com')
    expect(previewResponse.body.status).toBe('pending')
    expect(previewResponse.body.canAccept).toBe(true)
    expect(previewResponse.body.organizationName).toBe('Pulselane Labs')

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
    expect(emailDeliveriesFirstPage.body.items[0].sender?.email).toBe('owner@example.com')
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
          email: 'invitee@example.com',
          status: 'pending'
        }),
        {
          accessToken: ownerAccessToken,
          organizationId
        }
      ),
      200
    )

    expect(filteredInvitations.body.items).toHaveLength(2)
    expect(filteredInvitations.body.items[0].email).toBe('second-invitee@example.com')

    const { response: inviteeSignup } = await signupUser(app, {
      email: 'invitee@example.com',
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
    expect(secondInvitationResponse.body.email).toBe('second-invitee@example.com')
  })

  it('should reject invitation acceptance when authenticated user email does not match invitation email', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner-mismatch@example.com',
      organizationName: 'Mismatch Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        email: 'expected-invitee@example.com',
        role: 'member'
      }),
      201
    )

    const { response: otherUserSignup } = await signupUser(app, {
      email: 'different-user@example.com',
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

  it('should revoke a pending invitation and block acceptance afterwards', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner-revoke@example.com',
      organizationName: 'Revoke Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        email: 'invitee-revoke@example.com',
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
      email: 'invitee-revoke@example.com',
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

  it('should resend a pending invitation and create another email delivery', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner-resend@example.com',
      organizationName: 'Pulselane Resend Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        email: 'invitee-resend@example.com',
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
    expect(emailDeliveriesResponse.body.items[0].to).toBe('invitee-resend@example.com')
    expect(emailDeliveriesResponse.body.items[1].to).toBe('invitee-resend@example.com')
  })

  it('should allow only one pending invitation when two create requests race for the same email', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'owner-race-create@example.com',
      organizationName: 'Race Create Workspace'
    })

    const [firstCreate, secondCreate] = await Promise.all([
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'duplicate-invitee@example.com',
        role: 'member'
      }),
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'duplicate-invitee@example.com',
        role: 'member'
      })
    ])

    const statuses = [firstCreate.status, secondCreate.status].sort((a, b) => a - b)

    expect(statuses).toEqual([201, 409])

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: owner.organizationId,
        email: 'duplicate-invitee@example.com'
      }
    })

    expect(invitations).toHaveLength(1)
    expect(invitations[0].status).toBe('pending')
  })

  it('should allow only one successful acceptance when two accept requests race on the same token', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'owner-race-accept@example.com',
      organizationName: 'Race Accept Workspace'
    })

    const createInvitationResponse = await expectTyped<InvitationResponse & { token: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'race-accept-invitee@example.com',
        role: 'member'
      }),
      201
    )

    const invitee = await createAuthenticatedUser(app, prisma, {
      email: 'race-accept-invitee@example.com',
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
})
