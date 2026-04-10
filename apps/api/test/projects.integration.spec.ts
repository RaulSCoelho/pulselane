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

describe('Projects integration', () => {
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

  it('should create, paginate with cursor, archive projects, and block creation for archived client', async () => {
    const { accessToken, organizationId } = await signupAndGetContext({
      app,
      prisma,
      email: 'projects-owner@example.com',
      organizationName: 'Projects Workspace',
    });

    const createClient = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        name: 'Pulselane Client',
      })
      .expect(201);

    const clientId = createClient.body.id as string;

    const firstProject = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId,
        name: 'Project One',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId,
        name: 'Project Two',
      })
      .expect(201);

    const thirdProject = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId,
        name: 'Project Three',
      })
      .expect(201);

    const firstProjectId = firstProject.body.id as string;
    const thirdProjectId = thirdProject.body.id as string;

    const firstPage = await request(app.getHttpServer())
      .get(`/api/projects?clientId=${clientId}&limit=2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.meta.hasNextPage).toBe(true);
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string');

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/projects?clientId=${clientId}&limit=2&cursor=${firstPage.body.meta.nextCursor as string}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].id).toBe(firstProjectId);

    await request(app.getHttpServer())
      .delete(`/api/projects/${thirdProjectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    const defaultList = await request(app.getHttpServer())
      .get(`/api/projects?clientId=${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(
      defaultList.body.items.some(
        (item: { id: string }) => item.id === thirdProjectId,
      ),
    ).toBe(false);

    const archivedList = await request(app.getHttpServer())
      .get(`/api/projects?clientId=${clientId}&includeArchived=true`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    const archivedProject = archivedList.body.items.find(
      (item: { id: string }) => item.id === thirdProjectId,
    );

    expect(archivedProject).toBeTruthy();
    expect(archivedProject.status).toBe('archived');

    await request(app.getHttpServer())
      .patch(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        status: 'archived',
      })
      .expect(200);

    const createForArchivedClient = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        clientId,
        name: 'Blocked Project',
      })
      .expect(400);

    expect(createForArchivedClient.body.message).toBe(
      'Cannot create a project for an archived client',
    );
  });
});
