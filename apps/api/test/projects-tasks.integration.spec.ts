/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import './helpers/test-env';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/prisma-test-utils';
import {
  getCurrentUser,
  signupAndGetAccessToken,
} from './helpers/auth-helpers';
import { createTestApp } from './helpers/create-test-app';

describe('Projects and Tasks integration', () => {
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

  it('should create project and task linked to the same organization context', async () => {
    const { accessToken } = await signupAndGetAccessToken(app);
    const me = await getCurrentUser(app, accessToken);
    const organizationId = me.memberships[0].organization.id;
    const userId = me.id;

    const clientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Acme Corp',
      })
      .expect(201);

    const projectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId: clientResponse.body.id,
        name: 'Website Redesign',
      })
      .expect(201);

    expect(projectResponse.body.client.id).toBe(clientResponse.body.id);

    const taskResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId: projectResponse.body.id,
        title: 'Prepare first draft',
        assigneeUserId: userId,
      })
      .expect(201);

    expect(taskResponse.body.project.id).toBe(projectResponse.body.id);
    expect(taskResponse.body.assignee.id).toBe(userId);

    const auditResponse = await request(app.getHttpServer())
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ entityType: 'task', action: 'created' })
      .expect(200);

    expect(auditResponse.body.items).toHaveLength(1);
    expect(auditResponse.body.items[0].entityType).toBe('task');
  });
});
