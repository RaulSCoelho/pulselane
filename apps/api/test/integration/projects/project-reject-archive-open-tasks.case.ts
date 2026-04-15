import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerProjectRejectArchiveOpenTasksCase(): void {
  it('should reject archiving a project when it still has open tasks', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'project-archive-open-tasks-owner@example.com',
      organizationName: 'Project Archive Guard Workspace'
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
        name: 'Open Tasks Project'
      }
    })

    await prisma.task.create({
      data: {
        organizationId: owner.organizationId,
        projectId: project.id,
        title: 'Still open'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/projects/${project.id}`), owner),
      409
    )

    expect(response.body.message).toBe('Cannot archive a project with open tasks')

    const currentProject = await prisma.project.findUniqueOrThrow({
      where: {
        id: project.id
      }
    })

    expect(currentProject.status).toBe('active')
    expect(currentProject.archivedAt).toBeNull()
  })
}
