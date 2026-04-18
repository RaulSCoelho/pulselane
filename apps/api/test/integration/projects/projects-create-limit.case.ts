import { billingPlanCatalog } from '@/modules/billing/billing-plan-catalog'
import { BillingPlan, ClientStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createClientRecord, createProjectRecord } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

const FREE_PROJECT_LIMIT = billingPlanCatalog[BillingPlan.free].limits.projects ?? 0

export function registerProjectsCreateLimitCase(): void {
  it('should reject project creation when the free plan project limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'projects-create-limit@example.com',
      organizationName: 'Projects Create Limit Workspace'
    })

    const client = await createClientRecord(prisma, {
      organizationId: owner.organizationId,
      data: {
        name: 'Projects Create Limit Client',
        status: ClientStatus.active,
        email: null,
        companyName: null
      }
    })

    for (let index = 0; index < FREE_PROJECT_LIMIT; index += 1) {
      await createProjectRecord(prisma, {
        organizationId: owner.organizationId,
        clientId: client.id,
        data: {
          name: `Existing Project ${index + 1}`
        }
      })
    }

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId: client.id,
        name: 'Overflow Project'
      }),
      403
    )

    expect(response.body.message).toBe('Plan limit reached for projects')

    const projects = await prisma.project.findMany({
      where: {
        organizationId: owner.organizationId
      }
    })

    expect(projects).toHaveLength(FREE_PROJECT_LIMIT)
    expect(projects.some(project => project.name === 'Overflow Project')).toBe(false)
  })
}
