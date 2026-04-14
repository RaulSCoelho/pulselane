import type { CreateClientDto } from '@/modules/clients/dto/requests/create-client.dto'
import type { UpdateClientDto } from '@/modules/clients/dto/requests/update-client.dto'
import { ClientStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { buildCreateClientDto } from '../../support/builders/request.builders'
import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ClientResponse, CursorPageResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerClientsCrudFlowCase(): void {
  it('should create, read, update, paginate with cursor, filter, and archive clients', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'clients-owner@example.com',
      organizationName: 'Clients Workspace'
    })

    const createFirstPayload: CreateClientDto = buildCreateClientDto({
      name: 'Acme',
      email: 'clients-acme@example.com',
      companyName: undefined,
      status: undefined
    })

    const createFirst = await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send(createFirstPayload),
      201
    )

    const firstClientId = createFirst.body.id

    const getFirst = await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/clients/${firstClientId}`), owner),
      200
    )

    expect(getFirst.body.id).toBe(firstClientId)
    expect(getFirst.body.name).toBe('Acme')
    expect(getFirst.body.email).toBe('clients-acme@example.com')

    const updatePayload: UpdateClientDto = {
      companyName: 'Acme LLC',
      status: ClientStatus.inactive,
      expectedUpdatedAt: createFirst.body.updatedAt
    }

    const updatedClient = await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/clients/${firstClientId}`), owner).send(updatePayload),
      200
    )

    expect(updatedClient.body.id).toBe(firstClientId)
    expect(updatedClient.body.companyName).toBe('Acme LLC')
    expect(updatedClient.body.status).toBe(ClientStatus.inactive)

    await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send(
        buildCreateClientDto({
          name: 'Beta',
          email: 'clients-beta@example.com',
          status: ClientStatus.inactive
        })
      ),
      201
    )

    const createThird = await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send(
        buildCreateClientDto({
          name: 'Gamma',
          email: 'clients-gamma@example.com'
        })
      ),
      201
    )

    const thirdClientId = createThird.body.id

    const firstPage = await expectTyped<CursorPageResponse<ClientResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients?limit=2'), owner),
      200
    )

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await expectTyped<CursorPageResponse<ClientResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get(`/api/clients?limit=2&cursor=${firstPage.body.meta.nextCursor ?? ''}`),
        owner
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredBySearch = await expectTyped<CursorPageResponse<ClientResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients?limit=10&search=acme@'), owner),
      200
    )

    expect(filteredBySearch.body.items).toHaveLength(1)
    expect(filteredBySearch.body.items[0].name).toBe('Acme')

    const filteredByStatus = await expectTyped<CursorPageResponse<ClientResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients?limit=10&status=inactive'), owner),
      200
    )

    expect(filteredByStatus.body.items).toHaveLength(2)

    await expectTyped<ClientResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/clients/${thirdClientId}`), owner),
      200
    )

    const defaultList = await expectTyped<CursorPageResponse<ClientResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients'), owner),
      200
    )

    expect(defaultList.body.items.some(item => item.id === thirdClientId)).toBe(false)

    const archivedList = await expectTyped<CursorPageResponse<ClientResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients?includeArchived=true'), owner),
      200
    )

    const archivedClient = archivedList.body.items.find(item => item.id === thirdClientId)

    expect(archivedClient).toBeTruthy()
    expect(archivedClient?.status).toBe(ClientStatus.archived)
    expect(archivedClient?.archivedAt).toBeTruthy()
  })
}
