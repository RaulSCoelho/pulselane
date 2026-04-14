import { UpdateProjectDto } from '@/modules/projects/dto/requests/update-project.dto'
import { ProjectStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse, ProjectResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerProjectOptimisticConcurrencyCase(): void {
  it('should reject stale project updates and prevent silent overwrite', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'project-concurrency-owner@example.com',
      organizationName: 'Project Concurrency Workspace'
    })

    const client = await prisma.client.create({
      data: {
        organizationId: owner.organizationId,
        name: 'Acme Corp'
      }
    })

    const created = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId: client.id,
        name: 'Migration'
      }),
      201
    )

    const staleUpdatedAt = created.body.updatedAt

    await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${created.body.id}`), owner).send({
        expectedUpdatedAt: staleUpdatedAt,
        description: 'Phase 1',
        status: ProjectStatus.on_hold
      } satisfies UpdateProjectDto),
      200
    )

    const staleResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${created.body.id}`), owner).send({
        expectedUpdatedAt: staleUpdatedAt,
        name: 'Overwritten Project'
      } satisfies UpdateProjectDto),
      409
    )

    expect(staleResponse.body.message).toBe('Project was updated by another request. Refresh and try again.')

    const current = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/projects/${created.body.id}`), owner),
      200
    )

    expect(current.body.description).toBe('Phase 1')
    expect(current.body.name).toBe('Migration')
  })
}
