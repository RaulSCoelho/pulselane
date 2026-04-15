import { TaskStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerTaskBlockedReasonCase(): void {
  it('should persist blocked reason when task is blocked and clear it when task leaves blocked status', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'task-blocked-reason-owner@example.com',
      organizationName: 'Task Blocked Reason Workspace'
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
        name: 'Blocked Reason Project'
      }
    })

    const created = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Blocked by dependency',
        status: TaskStatus.blocked,
        blockedReason: 'Waiting for vendor approval'
      }),
      201
    )

    expect(created.body.status).toBe(TaskStatus.blocked)
    expect(created.body.blockedReason).toBe('Waiting for vendor approval')

    const unblocked = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${created.body.id}`), owner).send({
        expectedUpdatedAt: created.body.updatedAt,
        status: TaskStatus.in_progress
      }),
      200
    )

    expect(unblocked.body.status).toBe(TaskStatus.in_progress)
    expect(unblocked.body.blockedReason).toBeNull()
  })

  it('should reject blocked reason when final status is not blocked', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'task-blocked-reason-invalid-owner@example.com',
      organizationName: 'Task Blocked Reason Invalid Workspace'
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
        name: 'Blocked Reason Invalid Project'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Invalid blocked reason',
        status: TaskStatus.todo,
        blockedReason: 'This should fail'
      }),
      400
    )

    expect(response.body.message).toBe('Blocked reason can only be set when task status is blocked')
  })
}
