/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import './helpers/test-env';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createTestApp } from './helpers/create-test-app';
import { signupAndGetContext } from './helpers/auth-test-utils';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/prisma-test-utils';

describe('Audit logs integration', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase(prisma);
  });

  it('should paginate audit logs with cursor and filter archived actions', async () => {
    const { accessToken, organizationId } = await signupAndGetContext({
      app,
      prisma,
      email: 'audit-owner@example.com',
      organizationName: 'Audit Workspace',
    });

    const firstClient = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'First Audit Client',
      })
      .expect(201);

    const secondClient = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Second Audit Client',
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/clients/${firstClient.body.id as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/clients/${secondClient.body.id as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    const firstPage = await request(app.getHttpServer())
      .get('/api/audit-logs?action=archived&entityType=client&limit=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(firstPage.body.items).toHaveLength(1);
    expect(firstPage.body.items[0].action).toBe('archived');
    expect(firstPage.body.items[0].entityType).toBe('client');
    expect(firstPage.body.meta.limit).toBe(1);
    expect(firstPage.body.meta.hasNextPage).toBe(true);
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string');

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/audit-logs?action=archived&entityType=client&limit=1&cursor=${firstPage.body.meta.nextCursor as string}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].action).toBe('archived');
    expect(secondPage.body.items[0].entityType).toBe('client');
    expect(secondPage.body.meta.hasNextPage).toBe(false);
    expect(secondPage.body.meta.nextCursor).toBeNull();
  });
});
