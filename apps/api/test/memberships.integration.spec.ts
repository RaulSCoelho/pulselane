/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import './helpers/test-env'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getCurrentUser, signupAndGetAccessToken, signupAndGetContext } from './helpers/auth-test-utils'
import { createTestApp } from './helpers/create-test-app'
import { setupTestDatabase, teardownTestDatabase } from './helpers/prisma-test-utils'

describe('Memberships integration', () => {
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

  it('should paginate memberships with cursor, filter memberships, and update role as owner', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'owner@example.com'
    })

    const me = await getCurrentUser(app, accessToken)
    const organizationId = me.memberships[0].organization.id

    const secondUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const thirdUser = await prisma.user.create({
      data: {
        name: 'Viewer User',
        email: 'viewer@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const membershipToUpdate = await prisma.membership.create({
      data: {
        userId: secondUser.id,
        organizationId,
        role: 'member'
      }
    })

    await prisma.membership.create({
      data: {
        userId: thirdUser.id,
        organizationId,
        role: 'viewer'
      }
    })

    const firstPage = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 2 })
      .expect(200)

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 2,
        cursor: firstPage.body.meta.nextCursor as string
      })
      .expect(200)

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredPage = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 10,
        search: 'member',
        role: 'member'
      })
      .expect(200)

    expect(filteredPage.body.items).toHaveLength(1)
    expect(filteredPage.body.items[0].user.email).toBe('member@example.com')
    expect(filteredPage.body.items[0].role).toBe('member')

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/memberships/${membershipToUpdate.id}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        role: 'admin'
      })
      .expect(200)

    expect(updateResponse.body.role).toBe('admin')
    expect(updateResponse.body.user.email).toBe('member@example.com')
  })

  it('should reject demoting the last owner of the organization', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'single-owner@example.com',
      organizationName: 'Single Owner Workspace'
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

  it('should reject demoting another owner when they are the last owner remaining besides self after concurrency lock check', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'owner-a@example.com',
      organizationName: 'Owner Count Workspace'
    })

    const me = await getCurrentUser(app, accessToken)
    const organizationId = me.memberships[0].organization.id

    const secondOwnerUser = await prisma.user.create({
      data: {
        name: 'Second Owner',
        email: 'owner-b@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const secondOwnerMembership = await prisma.membership.create({
      data: {
        userId: secondOwnerUser.id,
        organizationId,
        role: 'owner'
      }
    })

    await request(app.getHttpServer())
      .patch(`/api/memberships/${secondOwnerMembership.id}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        role: 'admin'
      })
      .expect(200)

    const updatedActorMembership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId: me.id
      }
    })

    expect(updatedActorMembership).not.toBeNull()
    expect(updatedActorMembership?.role).toBe('owner')

    const updatedSecondOwnerMembership = await prisma.membership.findUnique({
      where: {
        id: secondOwnerMembership.id
      }
    })

    expect(updatedSecondOwnerMembership).not.toBeNull()
    expect(updatedSecondOwnerMembership?.role).toBe('admin')
  })

  it('should reject admin promoting a membership to owner', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'owner-promote@example.com',
      organizationName: 'Admin Promote Workspace'
    })

    const me = await getCurrentUser(app, accessToken)
    const organizationId = me.memberships[0].organization.id

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin-promote@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const memberUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member-promote@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const adminMembership = await prisma.membership.create({
      data: {
        userId: adminUser.id,
        organizationId,
        role: 'admin'
      }
    })

    const memberMembership = await prisma.membership.create({
      data: {
        userId: memberUser.id,
        organizationId,
        role: 'member'
      }
    })

    const adminLogin = await signupAndGetContext({
      app,
      prisma,
      email: 'admin-promote-login@example.com',
      organizationName: 'Temporary Workspace'
    })

    await prisma.membership.deleteMany({
      where: {
        userId: adminLogin.userId
      }
    })

    await prisma.membership.create({
      data: {
        userId: adminLogin.userId,
        organizationId,
        role: 'admin'
      }
    })

    const response = await request(app.getHttpServer())
      .patch(`/api/memberships/${memberMembership.id}/role`)
      .set('Authorization', `Bearer ${adminLogin.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        role: 'owner'
      })
      .expect(403)

    expect(response.body.message).toBe('Admins cannot assign owner role')

    const persistedAdminMembership = await prisma.membership.findUnique({
      where: {
        id: adminMembership.id
      }
    })

    expect(persistedAdminMembership).not.toBeNull()
    expect(persistedAdminMembership?.role).toBe('admin')
  })
})
