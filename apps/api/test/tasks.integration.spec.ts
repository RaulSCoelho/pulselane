/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import './helpers/test-env'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { PrismaClient } from '@prisma/client'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { signupAndGetContext } from './helpers/auth-test-utils'
import { createTestApp } from './helpers/create-test-app'
import { setupTestDatabase, teardownTestDatabase } from './helpers/prisma-test-utils'

describe('Tasks integration', () => {
  let app: NestFastifyApplication
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
    await teardownTestDatabase(prisma)
  })

  it('should create, read, update, paginate with cursor, filter, archive tasks, and block creation or move to archived project', async () => {
    const owner = await signupAndGetContext({
      app,
      prisma,
      email: 'tasks-owner@example.com',
      organizationName: 'Tasks Workspace'
    })

    const teammate = await signupAndGetContext({
      app,
      prisma,
      email: 'tasks-teammate@example.com',
      organizationName: 'Tasks Teammate Workspace'
    })

    await prisma.membership.create({
      data: {
        userId: teammate.userId,
        organizationId: owner.organizationId,
        role: 'member'
      }
    })

    const createClient = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        name: 'Tasks Client'
      })
      .expect(201)

    const clientId = createClient.body.id as string

    const createProject = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        clientId,
        name: 'Tasks Project'
      })
      .expect(201)

    const archivedProject = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        clientId,
        name: 'Archived Target Project'
      })
      .expect(201)

    const projectId = createProject.body.id as string
    const archivedProjectId = archivedProject.body.id as string

    const firstTask = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        projectId,
        title: 'First task',
        assigneeUserId: teammate.userId
      })
      .expect(201)

    const firstTaskId = firstTask.body.id as string

    const getFirst = await request(app.getHttpServer())
      .get(`/api/tasks/${firstTaskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    expect(getFirst.body.id).toBe(firstTaskId)
    expect(getFirst.body.title).toBe('First task')
    expect(getFirst.body.assignee.id).toBe(teammate.userId)

    const updatedTask = await request(app.getHttpServer())
      .patch(`/api/tasks/${firstTaskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        description: 'Updated task description',
        status: 'in_progress',
        priority: 'urgent'
      })
      .expect(200)

    expect(updatedTask.body.id).toBe(firstTaskId)
    expect(updatedTask.body.description).toBe('Updated task description')
    expect(updatedTask.body.status).toBe('in_progress')
    expect(updatedTask.body.priority).toBe('urgent')

    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        projectId,
        title: 'Blocked task',
        status: 'blocked',
        priority: 'high'
      })
      .expect(201)

    const thirdTask = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        projectId,
        title: 'Third task'
      })
      .expect(201)

    const thirdTaskId = thirdTask.body.id as string

    const firstPage = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&limit=2`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&limit=2&cursor=${firstPage.body.meta.nextCursor as string}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredBySearch = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&limit=10&search=blocked`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    expect(filteredBySearch.body.items).toHaveLength(1)
    expect(filteredBySearch.body.items[0].title).toBe('Blocked task')

    const filteredByStatusAndPriority = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&limit=10&status=blocked&priority=high`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    expect(filteredByStatusAndPriority.body.items).toHaveLength(1)
    expect(filteredByStatusAndPriority.body.items[0].title).toBe('Blocked task')

    await request(app.getHttpServer())
      .patch(`/api/projects/${archivedProjectId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        status: 'archived'
      })
      .expect(200)

    const moveToArchivedProject = await request(app.getHttpServer())
      .patch(`/api/tasks/${firstTaskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        projectId: archivedProjectId
      })
      .expect(400)

    expect(moveToArchivedProject.body.message).toBe('Cannot move a task to an archived project')

    await request(app.getHttpServer())
      .delete(`/api/tasks/${thirdTaskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    const defaultList = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    expect(defaultList.body.items.some((item: { id: string }) => item.id === thirdTaskId)).toBe(false)

    const archivedList = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&includeArchived=true`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .expect(200)

    const archivedTask = archivedList.body.items.find((item: { id: string }) => item.id === thirdTaskId)

    expect(archivedTask).toBeTruthy()
    expect(archivedTask.status).toBe('archived')

    await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        status: 'archived'
      })
      .expect(200)

    const createForArchivedProject = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        projectId,
        title: 'Blocked by archived project'
      })
      .expect(400)

    expect(createForArchivedProject.body.message).toBe('Cannot create a task for an archived project')
  })

  it('should block unarchiving a task when the free plan active task limit is already reached', async () => {
    const owner = await signupAndGetContext({
      app,
      prisma,
      email: 'tasks-unarchive-limit@example.com',
      organizationName: 'Tasks Unarchive Limit Workspace'
    })

    const client = await prisma.client.create({
      data: {
        organizationId: owner.organizationId,
        name: 'Tasks Limit Client',
        status: 'active'
      }
    })

    const project = await prisma.project.create({
      data: {
        organizationId: owner.organizationId,
        clientId: client.id,
        name: 'Tasks Limit Project',
        status: 'active'
      }
    })

    const archivedTask = await prisma.task.create({
      data: {
        organizationId: owner.organizationId,
        projectId: project.id,
        title: 'Archived Task',
        status: 'archived',
        archivedAt: new Date()
      }
    })

    for (let index = 0; index < 100; index++) {
      await prisma.task.create({
        data: {
          organizationId: owner.organizationId,
          projectId: project.id,
          title: `Active Task ${index + 1}`,
          status: 'todo'
        }
      })
    }

    const response = await request(app.getHttpServer())
      .patch(`/api/tasks/${archivedTask.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', owner.organizationId)
      .send({
        status: 'todo'
      })
      .expect(403)

    expect(response.body.message).toBe('Plan limit reached for active tasks')

    const persistedTask = await prisma.task.findUnique({
      where: {
        id: archivedTask.id
      }
    })

    expect(persistedTask).not.toBeNull()
    expect(persistedTask?.status).toBe('archived')
  })
})
