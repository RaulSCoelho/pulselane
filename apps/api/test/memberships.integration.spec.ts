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

  it('should list memberships and update role as owner', async () => {
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

    const membership = await prisma.membership.create({
      data: {
        userId: secondUser.id,
        organizationId,
        role: 'member',
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(listResponse.body.items).toHaveLength(2);
    expect(listResponse.body.meta.total).toBe(2);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/memberships/${membership.id}/role`)
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
