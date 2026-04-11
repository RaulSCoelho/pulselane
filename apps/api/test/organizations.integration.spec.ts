/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import './helpers/test-env'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { signupAndGetContext } from './helpers/auth-test-utils'
import { createTestApp } from './helpers/create-test-app'
import { setupTestDatabase, teardownTestDatabase } from './helpers/prisma-test-utils'

describe('Organizations integration', () => {
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

  it('should list organizations for current user and resolve current organization from header', async () => {
    const primaryContext = await signupAndGetContext({
      app,
      prisma,
      email: 'organizations-user@example.com',
      organizationName: 'Primary Workspace'
    })

    const secondaryContext = await signupAndGetContext({
      app,
      prisma,
      email: 'organizations-secondary@example.com',
      organizationName: 'Secondary Workspace'
    })

    await prisma.membership.create({
      data: {
        userId: primaryContext.userId,
        organizationId: secondaryContext.organizationId,
        role: 'viewer'
      }
    })

    const listResponse = await request(app.getHttpServer())
      .get('/api/organizations')
      .set('Authorization', `Bearer ${primaryContext.accessToken}`)
      .expect(200)

    expect(listResponse.body.items).toHaveLength(2)
    expect(
      listResponse.body.items.some(
        (item: { id: string; name: string }) =>
          item.id === primaryContext.organizationId && item.name === 'Primary Workspace'
      )
    ).toBe(true)
    expect(
      listResponse.body.items.some(
        (item: { id: string; name: string }) =>
          item.id === secondaryContext.organizationId && item.name === 'Secondary Workspace'
      )
    ).toBe(true)

    const currentResponse = await request(app.getHttpServer())
      .get('/api/organizations/current')
      .set('Authorization', `Bearer ${primaryContext.accessToken}`)
      .set('x-organization-id', secondaryContext.organizationId)
      .expect(200)

    expect(currentResponse.body.id).toBe(secondaryContext.organizationId)
    expect(currentResponse.body.name).toBe('Secondary Workspace')
  })

  it('should reject current organization lookup when user is not a member of the requested organization', async () => {
    const firstUser = await signupAndGetContext({
      app,
      prisma,
      email: 'org-first@example.com',
      organizationName: 'Org First Workspace'
    })

    const secondUser = await signupAndGetContext({
      app,
      prisma,
      email: 'org-second@example.com',
      organizationName: 'Org Second Workspace'
    })

    const response = await request(app.getHttpServer())
      .get('/api/organizations/current')
      .set('Authorization', `Bearer ${firstUser.accessToken}`)
      .set('x-organization-id', secondUser.organizationId)
      .expect(403)

    expect(response.body.message).toBe('User is not a member of this organization')
  })
})
