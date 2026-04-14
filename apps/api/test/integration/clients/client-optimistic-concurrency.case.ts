import { ClientStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ClientResponse, ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerClientOptimisticConcurrencyCase(): void {
  it('should reject stale client updates and prevent silent overwrite', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'client-concurrency-owner@example.com',
      organizationName: 'Client Concurrency Workspace'
    })

    const created = await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Acme',
        email: 'acme@example.com'
      }),
      201
    )

    const staleUpdatedAt = created.body.updatedAt

    await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/clients/${created.body.id}`), owner).send({
        expectedUpdatedAt: staleUpdatedAt,
        companyName: 'Acme LLC',
        status: ClientStatus.inactive
      }),
      200
    )

    const staleResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/clients/${created.body.id}`), owner).send({
        expectedUpdatedAt: staleUpdatedAt,
        name: 'Acme Overwritten'
      }),
      409
    )

    expect(staleResponse.body.message).toBe('Client was updated by another request. Refresh and try again.')

    const current = await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/clients/${created.body.id}`), owner),
      200
    )

    expect(current.body.companyName).toBe('Acme LLC')
    expect(current.body.name).toBe('Acme')
  })
}
