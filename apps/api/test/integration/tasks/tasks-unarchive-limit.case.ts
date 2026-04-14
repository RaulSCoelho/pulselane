import type { UpdateTaskDto } from '@/modules/tasks/dto/requests/update-task.dto'
import { ClientStatus, ProjectStatus, TaskStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createProjectScenario, createTaskRecord } from '../../support/factories/domain.factory'
import { FREE_PLAN_LIMITS } from '../../support/fixtures/defaults'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerTasksUnarchiveLimitCase(): void {
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
        status: TaskStatus.todo,
        expectedUpdatedAt: archivedTask.updatedAt.toISOString()
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
}
