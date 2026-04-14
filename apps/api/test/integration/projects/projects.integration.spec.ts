import type { CreateClientDto } from '@/modules/clients/dto/requests/create-client.dto'
import type { UpdateClientDto } from '@/modules/clients/dto/requests/update-client.dto'
import type { CreateProjectDto } from '@/modules/projects/dto/requests/create-project.dto'
import type { UpdateProjectDto } from '@/modules/projects/dto/requests/update-project.dto'
import { ClientStatus, ProjectStatus } from '@prisma/client'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { buildCreateClientDto, buildCreateProjectDto } from '../../support/builders/request.builders'
import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createClientRecord, createProjectRecord } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, ErrorResponse, ProjectResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

describe('Projects integration', () => {
  it('should create, read, update, paginate with cursor, filter, archive projects, and block creation or move to archived client', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'projects-owner@example.com',
      organizationName: 'Projects Workspace'
    })

    const createClient = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Pulselane Client'
      } satisfies CreateClientDto),
      201
    )

    const secondClient = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Second Client'
      } satisfies CreateClientDto),
      201
    )

    const clientId = createClient.body.id
    const secondClientId = secondClient.body.id

    const firstProject = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Project One'
      } satisfies CreateProjectDto),
      201
    )

    const firstProjectId = firstProject.body.id

    const getFirst = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/projects/${firstProjectId}`), owner),
      200
    )

    expect(getFirst.body.id).toBe(firstProjectId)
    expect(getFirst.body.name).toBe('Project One')
    expect(getFirst.body.client?.id).toBe(clientId)

    const updatedProject = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${firstProjectId}`), owner).send({
        description: 'Updated description',
        status: ProjectStatus.completed
      } satisfies UpdateProjectDto),
      200
    )

    expect(updatedProject.body.id).toBe(firstProjectId)
    expect(updatedProject.body.description).toBe('Updated description')
    expect(updatedProject.body.status).toBe(ProjectStatus.completed)

    await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Project Two',
        status: ProjectStatus.on_hold
      } satisfies CreateProjectDto),
      201
    )

    const thirdProject = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Project Three'
      } satisfies CreateProjectDto),
      201
    )

    const thirdProjectId = thirdProject.body.id

    const firstPage = await expectTyped<CursorPageResponse<ProjectResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/projects?clientId=${clientId}&limit=2`), owner),
      200
    )

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await expectTyped<CursorPageResponse<ProjectResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get(
          `/api/projects?clientId=${clientId}&limit=2&cursor=${firstPage.body.meta.nextCursor ?? ''}`
        ),
        owner
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredBySearch = await expectTyped<CursorPageResponse<ProjectResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/projects?clientId=${clientId}&limit=10&search=two`), owner),
      200
    )

    expect(filteredBySearch.body.items).toHaveLength(1)
    expect(filteredBySearch.body.items[0].name).toBe('Project Two')

    const filteredByStatus = await expectTyped<CursorPageResponse<ProjectResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get(`/api/projects?clientId=${clientId}&limit=10&status=on_hold`),
        owner
      ),
      200
    )

    expect(filteredByStatus.body.items).toHaveLength(1)
    expect(filteredByStatus.body.items[0].name).toBe('Project Two')
    expect(filteredByStatus.body.items[0].status).toBe(ProjectStatus.on_hold)

    await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/clients/${secondClientId}`), owner).send({
        status: ClientStatus.archived
      } satisfies UpdateClientDto),
      200
    )

    const moveToArchivedClient = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${firstProjectId}`), owner).send({
        clientId: secondClientId
      } satisfies UpdateProjectDto),
      400
    )

    expect(moveToArchivedClient.body.message).toBe('Cannot move a project to an archived client')

    await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/projects/${thirdProjectId}`), owner),
      200
    )

    const defaultList = await expectTyped<CursorPageResponse<ProjectResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/projects?clientId=${clientId}`), owner),
      200
    )

    expect(defaultList.body.items.some(item => item.id === thirdProjectId)).toBe(false)

    const archivedList = await expectTyped<CursorPageResponse<ProjectResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/projects?clientId=${clientId}&includeArchived=true`), owner),
      200
    )

    const archivedProject = archivedList.body.items.find(item => item.id === thirdProjectId)

    expect(archivedProject).toBeTruthy()
    expect(archivedProject?.status).toBe(ProjectStatus.archived)

    await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/clients/${clientId}`), owner).send({
        status: ClientStatus.archived
      } satisfies UpdateClientDto),
      200
    )

    const createForArchivedClient = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Blocked Project'
      } satisfies CreateProjectDto),
      400
    )

    expect(createForArchivedClient.body.message).toBe('Cannot create a project for an archived client')
  })

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
        status: ProjectStatus.active
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

  it('should build default request payloads when needed', () => {
    const payload = buildCreateClientDto()
    expect(payload.name).toBeTypeOf('string')

    const projectPayload = buildCreateProjectDto('client-id')
    expect(projectPayload.clientId).toBe('client-id')
  })
})
