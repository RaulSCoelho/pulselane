import type { CreateTaskDto } from '@/modules/tasks/dto/requests/create-task.dto'
import type { UpdateTaskDto } from '@/modules/tasks/dto/requests/update-task.dto'
import { ClientStatus, ProjectStatus, TaskStatus } from '@prisma/client'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { buildCreateTaskDto } from '../../support/builders/request.builders'
import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import {
  addOrganizationMembership,
  createProjectScenario,
  createTaskRecord
} from '../../support/factories/domain.factory'
import { FREE_PLAN_LIMITS } from '../../support/fixtures/defaults'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, ErrorResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

describe('Tasks integration', () => {
  it('should create, read, update, paginate with cursor, filter, archive tasks, and block creation or move to archived project', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'tasks-owner@example.com',
      organizationName: 'Tasks Workspace'
    })

    const teammate = await createAuthenticatedUser(app, prisma, {
      email: 'tasks-teammate@example.com',
      organizationName: 'Tasks Teammate Workspace'
    })

    await addOrganizationMembership(prisma, {
      userId: teammate.userId,
      organizationId: owner.organizationId,
      role: 'member'
    })

    const createClient = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Tasks Client'
      }),
      201
    )

    const clientId = createClient.body.id

    const createProject = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Tasks Project'
      }),
      201
    )

    const archivedProject = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Archived Target Project'
      }),
      201
    )

    const projectId = createProject.body.id
    const archivedProjectId = archivedProject.body.id

    const firstTask = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId,
        title: 'First task',
        assigneeUserId: teammate.userId
      } satisfies CreateTaskDto),
      201
    )

    const firstTaskId = firstTask.body.id

    const getFirst = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/tasks/${firstTaskId}`), owner),
      200
    )

    expect(getFirst.body.id).toBe(firstTaskId)
    expect(getFirst.body.title).toBe('First task')
    expect(getFirst.body.assignee?.id).toBe(teammate.userId)

    const updatedTask = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${firstTaskId}`), owner).send({
        description: 'Updated task description',
        status: 'in_progress',
        priority: 'urgent'
      } satisfies UpdateTaskDto),
      200
    )

    expect(updatedTask.body.id).toBe(firstTaskId)
    expect(updatedTask.body.description).toBe('Updated task description')
    expect(updatedTask.body.status).toBe('in_progress')
    expect(updatedTask.body.priority).toBe('urgent')

    await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId,
        title: 'Blocked task',
        status: 'blocked',
        priority: 'high'
      } satisfies CreateTaskDto),
      201
    )

    const thirdTask = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId,
        title: 'Third task'
      } satisfies CreateTaskDto),
      201
    )

    const thirdTaskId = thirdTask.body.id

    const firstPage = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/tasks?projectId=${projectId}&limit=2`), owner),
      200
    )

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get(
          `/api/tasks?projectId=${projectId}&limit=2&cursor=${firstPage.body.meta.nextCursor ?? ''}`
        ),
        owner
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredBySearch = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/tasks?projectId=${projectId}&limit=10&search=blocked`), owner),
      200
    )

    expect(filteredBySearch.body.items).toHaveLength(1)
    expect(filteredBySearch.body.items[0].title).toBe('Blocked task')

    const filteredByStatusAndPriority = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get(`/api/tasks?projectId=${projectId}&limit=10&status=blocked&priority=high`),
        owner
      ),
      200
    )

    expect(filteredByStatusAndPriority.body.items).toHaveLength(1)
    expect(filteredByStatusAndPriority.body.items[0].title).toBe('Blocked task')

    await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${archivedProjectId}`), owner).send({
        status: ProjectStatus.archived
      }),
      200
    )

    const moveToArchivedProject = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${firstTaskId}`), owner).send({
        projectId: archivedProjectId
      } satisfies UpdateTaskDto),
      400
    )

    expect(moveToArchivedProject.body.message).toBe('Cannot move a task to an archived project')

    await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/tasks/${thirdTaskId}`), owner),
      200
    )

    const defaultList = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/tasks?projectId=${projectId}`), owner),
      200
    )

    expect(defaultList.body.items.some(item => item.id === thirdTaskId)).toBe(false)

    const archivedList = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get(`/api/tasks?projectId=${projectId}&includeArchived=true`), owner),
      200
    )

    const archivedTask = archivedList.body.items.find(item => item.id === thirdTaskId)

    expect(archivedTask).toBeTruthy()
    expect(archivedTask?.status).toBe('archived')

    await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/projects/${projectId}`), owner).send({
        status: ProjectStatus.archived
      }),
      200
    )

    const createForArchivedProject = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId,
        title: 'Blocked by archived project'
      } satisfies CreateTaskDto),
      400
    )

    expect(createForArchivedProject.body.message).toBe('Cannot create a task for an archived project')
  })

  it('should block unarchiving a task when the free plan active task limit is already reached', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'tasks-unarchive-limit@example.com',
      organizationName: 'Tasks Unarchive Limit Workspace'
    })

    const { client, project } = await createProjectScenario(prisma, {
      organizationId: owner.organizationId,
      clientData: {
        name: 'Tasks Limit Client',
        status: ClientStatus.active,
        email: null,
        companyName: null
      },
      projectData: {
        name: 'Tasks Limit Project',
        status: ProjectStatus.active
      }
    })

    expect(client.id).toBeTypeOf('string')
    expect(project.id).toBeTypeOf('string')

    const archivedTask = await createTaskRecord(prisma, {
      organizationId: owner.organizationId,
      projectId: project.id,
      data: {
        title: 'Archived Task',
        status: TaskStatus.archived,
        archivedAt: new Date()
      }
    })

    for (let index = 0; index < FREE_PLAN_LIMITS.activeTasks; index += 1) {
      await createTaskRecord(prisma, {
        organizationId: owner.organizationId,
        projectId: project.id,
        data: {
          title: `Active Task ${index + 1}`,
          status: TaskStatus.todo
        }
      })
    }

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${archivedTask.id}`), owner).send({
        status: TaskStatus.todo
      } satisfies UpdateTaskDto),
      403
    )

    expect(response.body.message).toBe('Plan limit reached for active tasks')

    const persistedTask = await prisma.task.findUnique({
      where: {
        id: archivedTask.id
      }
    })

    expect(persistedTask).not.toBeNull()
    expect(persistedTask?.status).toBe(TaskStatus.archived)
  })

  it('should build default task dto helper', () => {
    const payload = buildCreateTaskDto('project-id')
    expect(payload.projectId).toBe('project-id')
    expect(payload.title).toBeTypeOf('string')
  })
})
