import { TaskPriority, TaskStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerTaskOptimisticConcurrencyCase(): void {
  it('should reject stale task updates and prevent silent overwrite', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'task-concurrency-owner@example.com',
      organizationName: 'Task Concurrency Workspace'
    })

    const client = await prisma.client.create({
      data: {
        organizationId: owner.organizationId,
        name: 'Acme Corp'
      }
    })

    const project = await prisma.project.create({
      data: {
        organizationId: owner.organizationId,
        clientId: client.id,
        name: 'Delivery Project'
      }
    })

    const created = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Initial task'
      }),
      201
    )

    const staleUpdatedAt = created.body.updatedAt

    await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${created.body.id}`), owner).send({
        expectedUpdatedAt: staleUpdatedAt,
        status: TaskStatus.in_progress,
        priority: TaskPriority.high
      }),
      200
    )

    const staleResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${created.body.id}`), owner).send({
        expectedUpdatedAt: staleUpdatedAt,
        title: 'Overwritten task'
      }),
      409
    )

    expect(staleResponse.body.message).toBe('Task was updated by another request. Refresh and try again.')

    const current = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/tasks/${created.body.id}`), owner),
      200
    )

    expect(current.body.status).toBe(TaskStatus.in_progress)
    expect(current.body.priority).toBe(TaskPriority.high)
    expect(current.body.title).toBe('Initial task')
  })
}
