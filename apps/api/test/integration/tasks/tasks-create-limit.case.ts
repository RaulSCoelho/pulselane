import { billingPlanCatalog } from '@/modules/billing/billing-plan-catalog'
import { BillingPlan } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createProjectScenario, createTaskRecord } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

const FREE_ACTIVE_TASK_LIMIT = billingPlanCatalog[BillingPlan.free].limits.active_tasks ?? 0

export function registerTasksCreateLimitCase(): void {
  it('should reject active task creation when the free plan active task limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'tasks-create-limit@example.com',
      organizationName: 'Tasks Create Limit Workspace'
    })

    const { project } = await createProjectScenario(prisma, {
      organizationId: owner.organizationId
    })

    for (let index = 0; index < FREE_ACTIVE_TASK_LIMIT; index += 1) {
      await createTaskRecord(prisma, {
        organizationId: owner.organizationId,
        projectId: project.id,
        data: {
          title: `Existing Active Task ${index + 1}`
        }
      })
    }

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Overflow Task'
      }),
      403
    )

    expect(response.body.message).toBe('Plan limit reached for active tasks')

    const tasks = await prisma.task.findMany({
      where: {
        organizationId: owner.organizationId
      }
    })

    expect(tasks).toHaveLength(FREE_ACTIVE_TASK_LIMIT)
    expect(tasks.some(task => task.title === 'Overflow Task')).toBe(false)
  })
}
