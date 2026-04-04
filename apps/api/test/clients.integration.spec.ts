/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import './helpers/test-env';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
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
  let prisma: PrismaClient;

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
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].name).toBe('Acme Corp');

    const auditResponse = await request(app.getHttpServer())
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ entityType: 'client', action: 'created' })
      .expect(200);

    expect(auditResponse.body.items).toHaveLength(1);
    expect(auditResponse.body.items[0].entityType).toBe('client');
    expect(auditResponse.body.items[0].action).toBe('created');
  });
});
