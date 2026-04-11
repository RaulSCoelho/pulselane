/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import './helpers/test-env'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getCurrentUser, signupAndGetAccessToken, signupAndGetContext } from './helpers/auth-test-utils'
import { createTestApp } from './helpers/create-test-app'
import { setupTestDatabase, teardownTestDatabase } from './helpers/prisma-test-utils'

describe('Invitations integration', () => {
  let app: NestFastifyApplication
  let prisma: Awaited<ReturnType<typeof setupTestDatabase>>

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
    await teardownTestDatabase(prisma)
  })

  it('should create, preview, paginate and accept invitations with cursor-based responses', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner@example.com',
      organizationName: 'Pulselane Labs'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const firstInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee@example.com',
        role: 'member'
      })
      .expect(201)

    expect(firstInvitationResponse.body.email).toBe('invitee@example.com')
    expect(firstInvitationResponse.body.status).toBe('pending')
    expect(firstInvitationResponse.body.token).toBeDefined()

    const secondInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'second-invitee@example.com',
        role: 'viewer'
      })
      .expect(201)

    const previewResponse = await request(app.getHttpServer())
      .get('/api/invitations/preview')
      .query({
        token: firstInvitationResponse.body.token
      })
      .expect(200)

    expect(previewResponse.body.email).toBe('invitee@example.com')
    expect(previewResponse.body.status).toBe('pending')
    expect(previewResponse.body.canAccept).toBe(true)
    expect(previewResponse.body.organizationName).toBe('Pulselane Labs')

    const emailDeliveriesFirstPage = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 1 })
      .expect(200)

    expect(emailDeliveriesFirstPage.body.items).toHaveLength(1)
    expect(emailDeliveriesFirstPage.body.meta.limit).toBe(1)
    expect(emailDeliveriesFirstPage.body.meta.hasNextPage).toBe(true)
    expect(emailDeliveriesFirstPage.body.meta.nextCursor).toBeTypeOf('string')
    expect(emailDeliveriesFirstPage.body.items[0].organizationId).toBe(organizationId)
    expect(emailDeliveriesFirstPage.body.items[0].sentBy).toBe(ownerMe.id)
    expect(emailDeliveriesFirstPage.body.items[0].sender.email).toBe('owner@example.com')
    expect(emailDeliveriesFirstPage.body.items[0].status).toBe('sent')
    expect(emailDeliveriesFirstPage.body.items[0].metadata.type).toBe('organization_invitation')

    const emailDeliveriesSecondPage = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 1,
        cursor: emailDeliveriesFirstPage.body.meta.nextCursor as string
      })
      .expect(200)

    expect(emailDeliveriesSecondPage.body.items).toHaveLength(1)
    expect(emailDeliveriesSecondPage.body.meta.hasNextPage).toBe(false)
    expect(emailDeliveriesSecondPage.body.meta.nextCursor).toBeNull()

    const invitationsFirstPage = await request(app.getHttpServer())
      .get('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 1 })
      .expect(200)

    expect(invitationsFirstPage.body.items).toHaveLength(1)
    expect(invitationsFirstPage.body.meta.limit).toBe(1)
    expect(invitationsFirstPage.body.meta.hasNextPage).toBe(true)
    expect(invitationsFirstPage.body.meta.nextCursor).toBeTypeOf('string')

    const invitationsSecondPage = await request(app.getHttpServer())
      .get('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 1,
        cursor: invitationsFirstPage.body.meta.nextCursor as string
      })
      .expect(200)

    expect(invitationsSecondPage.body.items).toHaveLength(1)
    expect(invitationsSecondPage.body.meta.hasNextPage).toBe(false)
    expect(invitationsSecondPage.body.meta.nextCursor).toBeNull()

    const filteredInvitations = await request(app.getHttpServer())
      .get('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 10,
        email: 'invitee@example.com',
        status: 'pending'
      })
      .expect(200)

    expect(filteredInvitations.body.items).toHaveLength(2)
    expect(filteredInvitations.body.items[0].email).toBe('second-invitee@example.com')

    const invitee = await signupAndGetAccessToken(app, {
      email: 'invitee@example.com',
      organizationName: 'Other Workspace'
    })

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${invitee.accessToken}`)
      .send({
        token: firstInvitationResponse.body.token
      })
      .expect(201)

    expect(acceptResponse.body.status).toBe('accepted')

    const inviteeMe = await getCurrentUser(app, invitee.accessToken)
    expect(inviteeMe.memberships).toHaveLength(2)

    expect(secondInvitationResponse.body.email).toBe('second-invitee@example.com')
  })

  it('should reject invitation acceptance when authenticated user email does not match invitation email', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-mismatch@example.com',
      organizationName: 'Mismatch Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'expected-invitee@example.com',
        role: 'member'
      })
      .expect(201)

    const otherUser = await signupAndGetAccessToken(app, {
      email: 'different-user@example.com',
      organizationName: 'Different Workspace'
    })

    const response = await request(app.getHttpServer())
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .send({
        token: createInvitationResponse.body.token
      })
      .expect(403)

    expect(response.body.message).toBe('You can only accept invitations sent to your own email')
  })

  it('should revoke a pending invitation and block acceptance afterwards', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-revoke@example.com',
      organizationName: 'Revoke Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee-revoke@example.com',
        role: 'member'
      })
      .expect(201)

    const revokeResponse = await request(app.getHttpServer())
      .patch(`/api/invitations/${createInvitationResponse.body.id}/revoke`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(revokeResponse.body.status).toBe('revoked')

    const previewResponse = await request(app.getHttpServer())
      .get('/api/invitations/preview')
      .query({
        token: createInvitationResponse.body.token
      })
      .expect(200)

    expect(previewResponse.body.status).toBe('revoked')
    expect(previewResponse.body.canAccept).toBe(false)

    const invitee = await signupAndGetAccessToken(app, {
      email: 'invitee-revoke@example.com',
      organizationName: 'Invitee Revoke Workspace'
    })

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${invitee.accessToken}`)
      .send({
        token: createInvitationResponse.body.token
      })
      .expect(409)

    expect(acceptResponse.body.message).toBe('Invitation is no longer pending')
  })

  it('should resend a pending invitation and create another email delivery', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-resend@example.com',
      organizationName: 'Pulselane Resend Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee-resend@example.com',
        role: 'member'
      })
      .expect(201)

    const originalToken = createInvitationResponse.body.token

    const resendResponse = await request(app.getHttpServer())
      .post(`/api/invitations/${createInvitationResponse.body.id}/resend`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(201)

    expect(resendResponse.body.status).toBe('pending')
    expect(resendResponse.body.token).toBeDefined()
    expect(resendResponse.body.token).not.toBe(originalToken)

    const emailDeliveriesResponse = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 10 })
      .expect(200)

    expect(emailDeliveriesResponse.body.items).toHaveLength(2)
    expect(emailDeliveriesResponse.body.meta.limit).toBe(10)
    expect(emailDeliveriesResponse.body.meta.hasNextPage).toBe(false)
    expect(emailDeliveriesResponse.body.meta.nextCursor).toBeNull()
    expect(emailDeliveriesResponse.body.items[0].to).toBe('invitee-resend@example.com')
    expect(emailDeliveriesResponse.body.items[1].to).toBe('invitee-resend@example.com')
  })

  it('should allow only one pending invitation when two create requests race for the same email', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-race-create@example.com',
      organizationName: 'Race Create Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const [firstCreate, secondCreate] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/invitations')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .set('x-organization-id', organizationId)
        .send({
          email: 'duplicate-invitee@example.com',
          role: 'member'
        }),
      request(app.getHttpServer())
        .post('/api/invitations')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .set('x-organization-id', organizationId)
        .send({
          email: 'duplicate-invitee@example.com',
          role: 'member'
        })
    ])

    const statuses = [firstCreate.status, secondCreate.status].sort((a, b) => a - b)

    expect(statuses).toEqual([201, 409])

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId,
        email: 'duplicate-invitee@example.com'
      }
    })

    expect(invitations).toHaveLength(1)
    expect(invitations[0].status).toBe('pending')
  })

  it('should allow only one successful acceptance when two accept requests race on the same token', async () => {
    const owner = await signupAndGetContext({
      app,
      prisma,
      email: 'owner-race-accept@example.com',
      organizationName: 'Race Accept Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'race-accept-invitee@example.com',
        role: 'member'
      })
      .expect(201)

    const invitee = await signupAndGetContext({
      app,
      prisma,
      email: 'race-accept-invitee@example.com',
      organizationName: 'Race Accept Invitee Workspace'
    })

    const [firstAccept, secondAccept] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${invitee.accessToken}`)
        .send({
          token: createInvitationResponse.body.token
        }),
      request(app.getHttpServer())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${invitee.accessToken}`)
        .send({
          token: createInvitationResponse.body.token
        })
    ])

    const statuses = [firstAccept.status, secondAccept.status].sort((a, b) => a - b)

    expect(statuses).toEqual([201, 409])

    const acceptedMemberships = await prisma.membership.findMany({
      where: {
        organizationId,
        userId: invitee.userId
      }
    })

    expect(acceptedMemberships).toHaveLength(1)

    const invitation = await prisma.organizationInvitation.findUnique({
      where: {
        id: createInvitationResponse.body.id as string
      }
    })

    expect(invitation).not.toBeNull()
    expect(invitation?.status).toBe('accepted')
  })
})
