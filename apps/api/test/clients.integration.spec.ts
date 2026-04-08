/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import './helpers/test-env';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from './helpers/create-test-app';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/prisma-test-utils';
import {
  getCurrentUser,
  signupAndGetAccessToken,
} from './helpers/auth-helpers';

describe('Clients integration', () => {
  let app: NestFastifyApplication;
  let prisma: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase(prisma);
  });

  it('should create, list and audit a client inside current organization context', async () => {
    const { accessToken } = await signupAndGetAccessToken(app);
    const me = await getCurrentUser(app, accessToken);
    const organizationId = me.memberships[0].organization.id;

    const createResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Acme Corp',
        email: 'contact@acme.com',
        companyName: 'Acme Corporation',
      })
      .expect(201);

    expect(createResponse.body.name).toBe('Acme Corp');

    const listResponse = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].name).toBe('Acme Corp');
    expect(listResponse.body.meta.page).toBe(1);
    expect(listResponse.body.meta.pageSize).toBe(10);
    expect(listResponse.body.meta.total).toBe(1);
    expect(listResponse.body.meta.totalPages).toBe(1);

    const auditResponse = await request(app.getHttpServer())
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ entityType: 'client', action: 'created', page: 1, pageSize: 10 })
      .expect(200);

    expect(auditResponse.body.items).toHaveLength(1);
    expect(auditResponse.body.items[0].entityType).toBe('client');
    expect(auditResponse.body.items[0].action).toBe('created');
    expect(auditResponse.body.meta.total).toBe(1);
  });

  it('should forbid viewer from creating a client', async () => {
    const { accessToken } = await signupAndGetAccessToken(app);
    const me = await getCurrentUser(app, accessToken);
    const organizationId = me.memberships[0].organization.id;
    const userId = me.id;

    await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: {
        role: 'viewer',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Blocked Client',
      })
      .expect(403);

    expect(response.body.message).toBe(
      'You do not have permission to perform this action',
    );
  });
});
