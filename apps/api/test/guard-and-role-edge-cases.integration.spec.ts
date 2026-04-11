/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import './helpers/test-env'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getCurrentUser, signupAndGetAccessToken } from './helpers/auth-test-utils'
import { createTestApp } from './helpers/create-test-app'
import { setupTestDatabase, teardownTestDatabase } from './helpers/prisma-test-utils'

describe('Guard and role edge cases integration', () => {
  let app: NestFastifyApplication
  let prisma: Awaited<ReturnType<typeof setupTestDatabase>>

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
    await teardownTestDatabase(prisma)
  })

  it('should reject organization-scoped route without x-organization-id header', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'missing-header@example.com',
      organizationName: 'Header Workspace'
    })

    const response = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400)

    expect(response.body.statusCode).toBe(400)
    expect(response.body.error).toBe('Bad Request')
    expect(response.body.message).toBe('x-organization-id header is required')
  })

  it('should reject unauthenticated access to organization-scoped route', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/clients')
      .set('x-organization-id', 'some-org-id')
      .expect(401)

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
  })

  it('should allow viewer to list tasks but forbid viewer from deleting tasks', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'viewer-role@example.com',
      organizationName: 'Viewer Workspace'
    })

    const me = await getCurrentUser(app, accessToken)
    const organizationId = me.memberships[0].organization.id
    const userId = me.id

    const clientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Viewer Client'
      })
      .expect(201)

    const projectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId: clientResponse.body.id,
        name: 'Viewer Project'
      })
      .expect(201)

    const taskResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId: projectResponse.body.id,
        title: 'Viewer Task',
        assigneeUserId: userId
      })
      .expect(201)

    await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      data: {
        role: 'viewer'
      }
    })

    const listResponse = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 10 })
      .expect(200)

    expect(listResponse.body.items).toHaveLength(1)
    expect(listResponse.body.items[0].id).toBe(taskResponse.body.id)
    expect(listResponse.body.meta.limit).toBe(10)

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/tasks/${taskResponse.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(403)

    expect(deleteResponse.body.message).toBe('You do not have permission to perform this action')
  })

  it('should forbid owner from removing own owner role', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'self-owner@example.com',
      organizationName: 'Owner Workspace'
    })

    const me = await getCurrentUser(app, accessToken)
    const organizationId = me.memberships[0].organization.id
    const ownerMembershipId = me.memberships[0].id

    const response = await request(app.getHttpServer())
      .patch(`/api/memberships/${ownerMembershipId}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        role: 'admin'
      })
      .expect(403)

    expect(response.body.message).toBe('Owner cannot remove own owner role')
  })

  it('should reject task listing when assignee filter belongs to another organization', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'task-filter-owner@example.com',
      organizationName: 'Task Filter Workspace'
    })
    const outsider = await signupAndGetAccessToken(app, {
      email: 'task-filter-outsider@example.com',
      organizationName: 'Task Filter Outsider Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const outsiderMe = await getCurrentUser(app, outsider.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const response = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        assigneeUserId: outsiderMe.id,
        limit: 10
      })
      .expect(404)

    expect(response.body.message).toBe('Assignee not found in this organization')
  })

  it('should reject project listing when client filter belongs to another organization', async () => {
    const ownerA = await signupAndGetAccessToken(app, {
      email: 'project-filter-a@example.com',
      organizationName: 'Project Filter Workspace A'
    })
    const ownerB = await signupAndGetAccessToken(app, {
      email: 'project-filter-b@example.com',
      organizationName: 'Project Filter Workspace B'
    })

    const ownerAMe = await getCurrentUser(app, ownerA.accessToken)
    const ownerBMe = await getCurrentUser(app, ownerB.accessToken)

    const organizationAId = ownerAMe.memberships[0].organization.id
    const organizationBId = ownerBMe.memberships[0].organization.id

    const foreignClientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .set('x-organization-id', organizationBId)
      .send({
        name: 'Foreign Filter Client'
      })
      .expect(201)

    const response = await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .set('x-organization-id', organizationAId)
      .query({
        clientId: foreignClientResponse.body.id,
        limit: 10
      })
      .expect(404)

    expect(response.body.message).toBe('Client not found')
  })
})
