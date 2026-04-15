import { TaskStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerTaskFiltersOrderingCase(): void {
  it('should filter overdue tasks, filter by due date interval, and paginate with due date ordering', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'task-filters-owner@example.com',
      organizationName: 'Task Filters Workspace'
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
        name: 'Filters Project'
      }
    })

    const now = Date.now()

    await prisma.task.createMany({
      data: [
        {
          organizationId: owner.organizationId,
          projectId: project.id,
          title: 'Overdue open',
          status: TaskStatus.todo,
          dueDate: new Date(now - 3 * 24 * 60 * 60 * 1000)
        },
        {
          organizationId: owner.organizationId,
          projectId: project.id,
          title: 'Overdue done',
          status: TaskStatus.done,
          dueDate: new Date(now - 2 * 24 * 60 * 60 * 1000)
        },
        {
          organizationId: owner.organizationId,
          projectId: project.id,
          title: 'Range first',
          status: TaskStatus.in_progress,
          dueDate: new Date('2026-05-10T10:00:00.000Z')
        },
        {
          organizationId: owner.organizationId,
          projectId: project.id,
          title: 'Range second',
          status: TaskStatus.todo,
          dueDate: new Date('2026-05-12T10:00:00.000Z')
        },
        {
          organizationId: owner.organizationId,
          projectId: project.id,
          title: 'No due date',
          status: TaskStatus.todo,
          dueDate: null
        }
      ]
    })

    const overdueResponse = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/tasks').query({ overdue: true }), owner),
      200
    )

    expect(overdueResponse.body.items).toHaveLength(1)
    expect(overdueResponse.body.items[0].title).toBe('Overdue open')

    const intervalResponse = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/tasks').query({
          dueDateFrom: '2026-05-10T00:00:00.000Z',
          dueDateTo: '2026-05-12T23:59:59.999Z',
          sortBy: 'due_date',
          sortDirection: 'asc'
        }),
        owner
      ),
      200
    )

    expect(intervalResponse.body.items).toHaveLength(2)
    expect(intervalResponse.body.items[0].title).toBe('Range first')
    expect(intervalResponse.body.items[1].title).toBe('Range second')

    const orderedFirstPage = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/tasks').query({
          sortBy: 'due_date',
          sortDirection: 'asc',
          limit: 2
        }),
        owner
      ),
      200
    )

    expect(orderedFirstPage.body.items).toHaveLength(2)
    expect(orderedFirstPage.body.items[0].title).toBe('Overdue open')
    expect(orderedFirstPage.body.items[1].title).toBe('Overdue done')
    expect(orderedFirstPage.body.meta.hasNextPage).toBe(true)
    expect(orderedFirstPage.body.meta.nextCursor).toBeTypeOf('string')

    const orderedSecondPage = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/tasks')
          .query({
            sortBy: 'due_date',
            sortDirection: 'asc',
            limit: 2,
            cursor: orderedFirstPage.body.meta.nextCursor ?? ''
          }),
        owner
      ),
      200
    )

    expect(orderedSecondPage.body.items).toHaveLength(2)
    expect(orderedSecondPage.body.items[0].title).toBe('Range first')
    expect(orderedSecondPage.body.items[1].title).toBe('Range second')
    expect(orderedSecondPage.body.meta.hasNextPage).toBe(true)
    expect(orderedSecondPage.body.meta.nextCursor).toBeTypeOf('string')

    const orderedThirdPage = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/tasks')
          .query({
            sortBy: 'due_date',
            sortDirection: 'asc',
            limit: 2,
            cursor: orderedSecondPage.body.meta.nextCursor ?? ''
          }),
        owner
      ),
      200
    )

    expect(orderedThirdPage.body.items).toHaveLength(1)
    expect(orderedThirdPage.body.items[0].title).toBe('No due date')
    expect(orderedThirdPage.body.meta.hasNextPage).toBe(false)
    expect(orderedThirdPage.body.meta.nextCursor).toBeNull()
  })
}
