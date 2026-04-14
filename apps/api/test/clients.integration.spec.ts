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

describe('Clients integration', () => {
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

  it('should create, read, update, paginate with cursor, filter, and archive clients', async () => {
    const { accessToken, organizationId } = await signupAndGetContext({
      app,
      prisma,
      email: 'clients-owner@example.com',
      organizationName: 'Clients Workspace'
    })

    const createFirst = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Acme',
        email: 'acme@example.com'
      })
      .expect(201)

    const firstClientId = createFirst.body.id as string

    const getFirst = await request(app.getHttpServer())
      .get(`/api/clients/${firstClientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(getFirst.body.id).toBe(firstClientId)
    expect(getFirst.body.name).toBe('Acme')
    expect(getFirst.body.email).toBe('acme@example.com')

    const updatedClient = await request(app.getHttpServer())
      .patch(`/api/clients/${firstClientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        companyName: 'Acme LLC',
        status: 'inactive'
      })
      .expect(200)

    expect(updatedClient.body.id).toBe(firstClientId)
    expect(updatedClient.body.companyName).toBe('Acme LLC')
    expect(updatedClient.body.status).toBe('inactive')

    await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Beta',
        email: 'beta@example.com',
        status: 'inactive'
      })
      .expect(201)

    const createThird = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Gamma',
        email: 'gamma@example.com'
      })
      .expect(201)

    const thirdClientId = createThird.body.id as string

    const firstPage = await request(app.getHttpServer())
      .get('/api/clients?limit=2')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await request(app.getHttpServer())
      .get(`/api/clients?limit=2&cursor=${firstPage.body.meta.nextCursor as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredBySearch = await request(app.getHttpServer())
      .get('/api/clients?limit=10&search=acm')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(filteredBySearch.body.items).toHaveLength(1)
    expect(filteredBySearch.body.items[0].name).toBe('Acme')

    const filteredByStatus = await request(app.getHttpServer())
      .get('/api/clients?limit=10&status=inactive')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(filteredByStatus.body.items).toHaveLength(2)

    await request(app.getHttpServer())
      .delete(`/api/clients/${thirdClientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    const defaultList = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    expect(defaultList.body.items.some((item: { id: string }) => item.id === thirdClientId)).toBe(false)

    const archivedList = await request(app.getHttpServer())
      .get('/api/clients?includeArchived=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200)

    const archivedClient = archivedList.body.items.find((item: { id: string }) => item.id === thirdClientId)

    expect(archivedClient).toBeTruthy()
    expect(archivedClient.status).toBe('archived')
    expect(archivedClient.archivedAt).toBeTruthy()
  })

  it('should block unarchiving a client when the free plan client limit is already reached', async () => {
    const { accessToken, organizationId } = await signupAndGetContext({
      app,
      prisma,
      email: 'clients-unarchive-limit@example.com',
      organizationName: 'Clients Unarchive Limit Workspace'
    })

    const archivedClient = await prisma.client.create({
      data: {
        organizationId,
        name: 'Archived Client',
        status: 'archived',
        archivedAt: new Date()
      }
    })

    for (let index = 0; index < 10; index++) {
      await prisma.client.create({
        data: {
          organizationId,
          name: `Active Client ${index + 1}`,
          status: 'active'
        }
      })
    }

    const response = await request(app.getHttpServer())
      .patch(`/api/clients/${archivedClient.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        status: 'active'
      })
      .expect(403)

    expect(response.body.message).toBe('Plan limit reached for clients')

    const persistedClient = await prisma.client.findUnique({
      where: {
        id: archivedClient.id
      }
    })

    expect(persistedClient).not.toBeNull()
    expect(persistedClient?.status).toBe('archived')
  })
})
