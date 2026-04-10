/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

describe('Tasks integration', () => {
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

  it('should create, paginate with cursor, archive tasks, and block creation for archived project', async () => {
    const { accessToken, organizationId } = await signupAndGetContext({
      app,
      prisma,
      email: 'tasks-owner@example.com',
      organizationName: 'Tasks Workspace',
    });

    const createClient = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Tasks Client',
      })
      .expect(201);

    const clientId = createClient.body.id as string;

    const createProject = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId,
        name: 'Tasks Project',
      })
      .expect(201);

    const projectId = createProject.body.id as string;

    const firstTask = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId,
        title: 'First task',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId,
        title: 'Blocked task',
        status: 'blocked',
      })
      .expect(201);

    const thirdTask = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId,
        title: 'Third task',
      })
      .expect(201);

    const firstTaskId = firstTask.body.id as string;
    const thirdTaskId = thirdTask.body.id as string;

    const firstPage = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&limit=2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.meta.hasNextPage).toBe(true);
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string');

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/tasks?projectId=${projectId}&limit=2&cursor=${firstPage.body.meta.nextCursor as string}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].id).toBe(firstTaskId);

    await request(app.getHttpServer())
      .delete(`/api/tasks/${thirdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    const defaultList = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(
      defaultList.body.items.some(
        (item: { id: string }) => item.id === thirdTaskId,
      ),
    ).toBe(false);

    const archivedList = await request(app.getHttpServer())
      .get(`/api/tasks?projectId=${projectId}&includeArchived=true`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    const archivedTask = archivedList.body.items.find(
      (item: { id: string }) => item.id === thirdTaskId,
    );

    expect(archivedTask).toBeTruthy();
    expect(archivedTask.status).toBe('archived');

    await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        status: 'archived',
      })
      .expect(200);

    const createForArchivedProject = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        projectId,
        title: 'Blocked by archived project',
      })
      .expect(400);

    expect(createForArchivedProject.body.message).toBe(
      'Cannot create a task for an archived project',
    );
  });
});
