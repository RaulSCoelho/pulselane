import { billingPlanCatalog } from '@/modules/billing/billing-plan-catalog'
import { BillingPlan } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createClientRecord } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

const FREE_CLIENT_LIMIT = billingPlanCatalog[BillingPlan.free].limits.clients ?? 0

export function registerClientsCreateLimitCase(): void {
  it('should reject client creation when the free plan client limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'clients-create-limit@example.com',
      organizationName: 'Clients Create Limit Workspace'
    })

    for (let index = 0; index < FREE_CLIENT_LIMIT; index += 1) {
      await createClientRecord(prisma, {
        organizationId: owner.organizationId,
        data: {
          name: `Existing Client ${index + 1}`,
          email: null,
          companyName: null
        }
      })
    }

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Overflow Client'
      }),
      403
    )

    expect(response.body.message).toBe('Plan limit reached for clients')

    const clients = await prisma.client.findMany({
      where: {
        organizationId: owner.organizationId
      }
    })

    expect(clients).toHaveLength(FREE_CLIENT_LIMIT)
    expect(clients.some(client => client.name === 'Overflow Client')).toBe(false)
  })
}
