import type { UpdateProjectDto } from '@/modules/projects/dto/requests/update-project.dto'
import { ClientStatus, ProjectStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createClientRecord, createProjectRecord } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerProjectsUnarchiveLimitCase(): void {
  it('should block unarchiving a project when the free plan project limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'projects-unarchive-limit@example.com',
      organizationName: 'Projects Unarchive Limit Workspace'
    })

    const client = await createClientRecord(prisma, {
      organizationId: owner.organizationId,
      data: {
        name: 'Projects Limit Client',
        status: ClientStatus.active,
        email: null,
        companyName: null
      }
    })

    const archivedProject = await createProjectRecord(prisma, {
      organizationId: owner.organizationId,
      clientId: client.id,
      data: {
        name: 'Archived Project',
        status: ProjectStatus.archived,
        archivedAt: new Date()
      }
    })

    for (let index = 0; index < 10; index += 1) {
      await createProjectRecord(prisma, {
        organizationId: owner.organizationId,
        clientId: client.id,
        data: {
          name: `Active Project ${index + 1}`,
          status: ProjectStatus.active
        }
      })
    }

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${archivedProject.id}`), owner).send({
        status: ProjectStatus.active,
        expectedUpdatedAt: archivedProject.updatedAt.toISOString()
      } satisfies UpdateProjectDto),
      403
    )

    expect(response.body.message).toBe('Plan limit reached for projects')

    const persistedProject = await prisma.project.findUnique({
      where: {
        id: archivedProject.id
      }
    })

    expect(persistedProject).not.toBeNull()
    expect(persistedProject?.status).toBe(ProjectStatus.archived)
  })
}
