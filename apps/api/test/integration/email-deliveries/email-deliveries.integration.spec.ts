import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, EmailDeliveryResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

describe('Email deliveries integration', () => {
  it('should paginate email deliveries with cursor and apply filters', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner-email-deliveries@example.com',
      organizationName: 'Email Deliveries Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    await withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
      accessToken: ownerSignup.body.accessToken,
      organizationId
    })
      .send({
        email: 'first-delivery@example.com',
        role: 'member'
      })
      .expect(201)

    await withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
      accessToken: ownerSignup.body.accessToken,
      organizationId
    })
      .send({
        email: 'second-delivery@example.com',
        role: 'viewer'
      })
      .expect(201)

    const firstPage = await expectTyped<CursorPageResponse<EmailDeliveryResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/email-deliveries').query({ limit: 1 }), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }),
      200
    )

    expect(firstPage.body.items).toHaveLength(1)
    expect(firstPage.body.meta.limit).toBe(1)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')
    expect(firstPage.body.items[0].organizationId).toBe(organizationId)
    expect(firstPage.body.items[0].sentBy).toBe(ownerMe.id)
    expect(firstPage.body.items[0].sender?.email).toBe('owner-email-deliveries@example.com')
    expect(firstPage.body.items[0].status).toBe('sent')
    expect((firstPage.body.items[0].metadata as { type?: string })?.type).toBe('organization_invitation')

    const secondPage = await expectTyped<CursorPageResponse<EmailDeliveryResponse>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/email-deliveries')
          .query({
            limit: 1,
            cursor: firstPage.body.meta.nextCursor ?? ''
          }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.limit).toBe(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredByRecipient = await expectTyped<CursorPageResponse<EmailDeliveryResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/email-deliveries').query({
          limit: 10,
          to: 'first-delivery@example.com',
          status: 'sent'
        }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      200
    )

    expect(filteredByRecipient.body.items).toHaveLength(1)
    expect(filteredByRecipient.body.items[0].to).toBe('first-delivery@example.com')
    expect(filteredByRecipient.body.items[0].status).toBe('sent')
    expect(filteredByRecipient.body.meta.limit).toBe(10)
    expect(filteredByRecipient.body.meta.hasNextPage).toBe(false)
    expect(filteredByRecipient.body.meta.nextCursor).toBeNull()
  })
})
