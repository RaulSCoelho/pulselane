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
} from './helpers/auth-test-utils';

describe('Memberships integration', () => {
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

  it('should paginate memberships with cursor, filter memberships, and update role as owner', async () => {
    const { accessToken } = await signupAndGetAccessToken(app, {
      email: 'owner@example.com',
    });

    const me = await getCurrentUser(app, accessToken);
    const organizationId = me.memberships[0].organization.id;

    const secondUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member@example.com',
        passwordHash: 'hashed-password',
      },
    });

    const thirdUser = await prisma.user.create({
      data: {
        name: 'Viewer User',
        email: 'viewer@example.com',
        passwordHash: 'hashed-password',
      },
    });

    const membershipToUpdate = await prisma.membership.create({
      data: {
        userId: secondUser.id,
        organizationId,
        role: 'member',
      },
    });

    await prisma.membership.create({
      data: {
        userId: thirdUser.id,
        organizationId,
        role: 'viewer',
      },
    });

    const firstPage = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 2 })
      .expect(200);

    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.meta.limit).toBe(2);
    expect(firstPage.body.meta.hasNextPage).toBe(true);
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string');

    const secondPage = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 2,
        cursor: firstPage.body.meta.nextCursor as string,
      })
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.meta.hasNextPage).toBe(false);
    expect(secondPage.body.meta.nextCursor).toBeNull();

    const filteredPage = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 10,
        search: 'member',
        role: 'member',
      })
      .expect(200);

    expect(filteredPage.body.items).toHaveLength(1);
    expect(filteredPage.body.items[0].user.email).toBe('member@example.com');
    expect(filteredPage.body.items[0].role).toBe('member');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/memberships/${membershipToUpdate.id}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        role: 'admin',
      })
      .expect(200);

    expect(updateResponse.body.role).toBe('admin');
    expect(updateResponse.body.user.email).toBe('member@example.com');
  });
});
