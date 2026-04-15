import { UpdateProjectDto } from '@/modules/projects/dto/requests/update-project.dto'
import type { CreateTaskDto } from '@/modules/tasks/dto/requests/create-task.dto'
import type { UpdateTaskDto } from '@/modules/tasks/dto/requests/update-task.dto'
import { ProjectStatus, TaskStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { addOrganizationMembership } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type {
  CursorPageResponse,
  ErrorResponse,
  ProjectResponse,
  TaskResponse
} from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerTasksCrudFlowCase(): void {
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

    const createProject = await expectTyped<ProjectResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId,
        name: 'Tasks Project'
      }),
      201
    )

    const archivedProject = await expectTyped<ProjectResponse>(
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
        priority: 'urgent',
        expectedUpdatedAt: firstTask.body.updatedAt
      } satisfies UpdateTaskDto),
      200
    )

    expect(updatedTask.body.id).toBe(firstTaskId)
    expect(updatedTask.body.description).toBe('Updated task description')
    expect(updatedTask.body.status).toBe('in_progress')
    expect(updatedTask.body.priority).toBe('urgent')

    const blockedTask = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId,
        title: 'Blocked task',
        status: 'blocked',
        priority: 'high',
        blockedReason: 'Waiting for client approval'
      } satisfies CreateTaskDto),
      201
    )

    expect(blockedTask.body.blockedReason).toBe('Waiting for client approval')

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
        status: ProjectStatus.archived,
        expectedUpdatedAt: archivedProject.body.updatedAt
      } satisfies UpdateProjectDto),
      200
    )

    const moveToArchivedProject = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${firstTaskId}`), owner).send({
        projectId: archivedProjectId,
        expectedUpdatedAt: updatedTask.body.updatedAt
      } satisfies UpdateTaskDto),
      400
    )

    expect(moveToArchivedProject.body.message).toBe('Cannot move a task to an archived project')

    const archiveProjectWithOpenTasks = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/projects/${projectId}`), owner),
      409
    )

    expect(archiveProjectWithOpenTasks.body.message).toBe('Cannot archive a project with open tasks')

    await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/tasks/${thirdTaskId}`), owner),
      200
    )

    const completedFirstTask = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${firstTaskId}`), owner).send({
        expectedUpdatedAt: updatedTask.body.updatedAt,
        status: TaskStatus.done
      } satisfies UpdateTaskDto),
      200
    )

    await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/tasks/${blockedTask.body.id}`), owner).send({
        expectedUpdatedAt: blockedTask.body.updatedAt,
        status: TaskStatus.done
      } satisfies UpdateTaskDto),
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
        status: ProjectStatus.archived,
        expectedUpdatedAt: createProject.body.updatedAt
      } satisfies UpdateProjectDto),
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
    expect(completedFirstTask.body.status).toBe(TaskStatus.done)
  })
}
