import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, ErrorResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerViewerTaskAccessCase(): void {
  it('should allow viewer to list tasks but forbid viewer from deleting tasks', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'access-viewer-role@example.com',
      organizationName: 'Viewer Workspace'
    })

    const clientResponse = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Viewer Client'
      }),
      201
    )

    const projectResponse = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId: clientResponse.body.id,
        name: 'Viewer Project'
      }),
      201
    )

    const taskResponse = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: projectResponse.body.id,
        title: 'Viewer Task',
        assigneeUserId: owner.userId
      }),
      201
    )

    await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId: owner.userId,
          organizationId: owner.organizationId
        }
      },
      data: {
        role: 'viewer'
      }
    })

    const listResponse = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/tasks').query({ limit: 10 }), owner),
      200
    )

    expect(listResponse.body.items).toHaveLength(1)
    expect(listResponse.body.items[0].id).toBe(taskResponse.body.id)
    expect(listResponse.body.meta.limit).toBe(10)

    const deleteResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/tasks/${taskResponse.body.id}`), owner),
      403
    )

    expect(deleteResponse.body.message).toBe('You do not have permission to perform this action')
  })
}
