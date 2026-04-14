import type { UpdateClientDto } from '@/modules/clients/dto/requests/update-client.dto'
import { ClientStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createClientRecord } from '../../support/factories/domain.factory'
import { FREE_PLAN_LIMITS } from '../../support/fixtures/defaults'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerClientsUnarchiveLimitCase(): void {
  it('should block unarchiving a client when the free plan client limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'clients-unarchive-limit@example.com',
      organizationName: 'Clients Unarchive Limit Workspace'
    })

    const archivedClient = await createClientRecord(prisma, {
      organizationId: owner.organizationId,
      data: {
        name: 'Archived Client',
        status: ClientStatus.archived,
        archivedAt: new Date(),
        email: null,
        companyName: null
      }
    })

    for (let index = 0; index < FREE_PLAN_LIMITS.clients; index += 1) {
      await createClientRecord(prisma, {
        organizationId: owner.organizationId,
        data: {
          name: `Active Client ${index + 1}`,
          status: ClientStatus.active,
          email: null,
          companyName: null
        }
      })
    }

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/clients/${archivedClient.id}`), owner).send({
        status: ClientStatus.active,
        expectedUpdatedAt: archivedClient.updatedAt.toISOString()
      } satisfies UpdateClientDto),
      403
    )

    expect(response.body.message).toBe('Plan limit reached for clients')

    const persistedClient = await prisma.client.findUnique({
      where: {
        id: archivedClient.id
      }
    })

    expect(persistedClient).not.toBeNull()
    expect(persistedClient?.status).toBe(ClientStatus.archived)
  })
}
