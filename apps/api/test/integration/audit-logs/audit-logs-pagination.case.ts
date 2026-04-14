import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { AuditLogResponse, CursorPageResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerAuditLogsPaginationCase(): void {
  it('should paginate audit logs with cursor and filter archived actions', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'audit-owner@example.com',
      organizationName: 'Audit Workspace'
    })

    const firstClient = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'First Audit Client'
      }),
      201
    )

    const secondClient = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Second Audit Client'
      }),
      201
    )

    await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/clients/${firstClient.body.id}`), owner),
      200
    )

    await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/clients/${secondClient.body.id}`), owner),
      200
    )

    const firstPage = await expectTyped<CursorPageResponse<AuditLogResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/audit-logs?action=archived&entityType=client&limit=1'), owner),
      200
    )

    expect(firstPage.body.items).toHaveLength(1)
    expect(firstPage.body.items[0].action).toBe('archived')
    expect(firstPage.body.items[0].entityType).toBe('client')
    expect(firstPage.body.meta.limit).toBe(1)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await expectTyped<CursorPageResponse<AuditLogResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get(
          `/api/audit-logs?action=archived&entityType=client&limit=1&cursor=${firstPage.body.meta.nextCursor ?? ''}`
        ),
        owner
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.items[0].action).toBe('archived')
    expect(secondPage.body.items[0].entityType).toBe('client')
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()
  })
}
