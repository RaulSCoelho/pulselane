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

describe('Tenant scoping and authorization integration', () => {
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

  it('should forbid access when x-organization-id belongs to another organization', async () => {
    const firstUser = await signupAndGetAccessToken(app, {
      email: 'tenant-user-1@example.com',
      organizationName: 'Tenant Workspace One'
    })
    const secondUser = await signupAndGetAccessToken(app, {
      email: 'tenant-user-2@example.com',
      organizationName: 'Tenant Workspace Two'
    })

    const secondUserMe = await getCurrentUser(app, secondUser.accessToken)
    const secondOrganizationId = secondUserMe.memberships[0].organization.id

    const response = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${firstUser.accessToken}`)
      .set('x-organization-id', secondOrganizationId)
      .expect(403)

    expect(response.body.message).toBe('User is not a member of this organization')
  })

  it('should reject project creation when client belongs to another organization', async () => {
    const ownerA = await signupAndGetAccessToken(app, {
      email: 'project-owner-a@example.com',
      organizationName: 'Project Workspace A'
    })
    const ownerB = await signupAndGetAccessToken(app, {
      email: 'project-owner-b@example.com',
      organizationName: 'Project Workspace B'
    })

    const ownerAMe = await getCurrentUser(app, ownerA.accessToken)
    const ownerBMe = await getCurrentUser(app, ownerB.accessToken)

    const organizationAId = ownerAMe.memberships[0].organization.id
    const organizationBId = ownerBMe.memberships[0].organization.id

    const clientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .set('x-organization-id', organizationBId)
      .send({
        name: 'Foreign Client'
      })
      .expect(201)

    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .set('x-organization-id', organizationAId)
      .send({
        clientId: clientResponse.body.id,
        name: 'Invalid Cross-Tenant Project'
      })
      .expect(404)

    expect(response.body.message).toBe('Client not found')
  })

  it('should reject task creation when assignee is not a member of the current organization', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'task-owner@example.com',
      organizationName: 'Task Workspace'
    })
    const outsider = await signupAndGetAccessToken(app, {
      email: 'task-outsider@example.com',
      organizationName: 'Outsider Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const outsiderMe = await getCurrentUser(app, outsider.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const clientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Task Client'
      })
      .expect(201)

    const projectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId: clientResponse.body.id,
        name: 'Task Project'
      })
      .expect(201)

    const response = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId: projectResponse.body.id,
        title: 'Cross-tenant assignee should fail',
        assigneeUserId: outsiderMe.id
      })
      .expect(404)

    expect(response.body.message).toBe('Assignee not found in this organization')
  })

  it('should forbid admin from inviting an owner', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'invite-owner@example.com',
      organizationName: 'Invitations Workspace'
    })
    const adminUser = await signupAndGetAccessToken(app, {
      email: 'invite-admin@example.com',
      organizationName: 'Admin Personal Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const adminMe = await getCurrentUser(app, adminUser.accessToken)

    const organizationId = ownerMe.memberships[0].organization.id
    const adminUserId = adminMe.id

    await prisma.membership.create({
      data: {
        userId: adminUserId,
        organizationId,
        role: 'admin'
      }
    })

    const response = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'new-owner@example.com',
        role: 'owner'
      })
      .expect(403)

    expect(response.body.message).toBe('Admins cannot invite owners')
  })

  it('should forbid admin from updating an owner membership', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'membership-owner@example.com',
      organizationName: 'Membership Workspace'
    })
    const adminUser = await signupAndGetAccessToken(app, {
      email: 'membership-admin@example.com',
      organizationName: 'Membership Admin Workspace'
    })

    const ownerMe = await getCurrentUser(app, owner.accessToken)
    const adminMe = await getCurrentUser(app, adminUser.accessToken)

    const organizationId = ownerMe.memberships[0].organization.id
    const ownerMembershipId = ownerMe.memberships[0].id

    await prisma.membership.create({
      data: {
        userId: adminMe.id,
        organizationId,
        role: 'admin'
      }
    })

    const response = await request(app.getHttpServer())
      .patch(`/api/memberships/${ownerMembershipId}/role`)
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        role: 'member'
      })
      .expect(403)

    expect(response.body.message).toBe('Admins cannot update owner memberships')
  })
})
