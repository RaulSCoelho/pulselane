/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

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

describe('Email deliveries integration', () => {
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

  it('should paginate email deliveries with cursor and apply filters', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-email-deliveries@example.com',
      organizationName: 'Email Deliveries Workspace',
    });

    const ownerMe = await getCurrentUser(app, owner.accessToken);
    const organizationId = ownerMe.memberships[0].organization.id;

    await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'first-delivery@example.com',
        role: 'member',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'second-delivery@example.com',
        role: 'viewer',
      })
      .expect(201);

    const firstPage = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ limit: 1 })
      .expect(200);

    expect(firstPage.body.items).toHaveLength(1);
    expect(firstPage.body.meta.limit).toBe(1);
    expect(firstPage.body.meta.hasNextPage).toBe(true);
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string');
    expect(firstPage.body.items[0].organizationId).toBe(organizationId);
    expect(firstPage.body.items[0].sentBy).toBe(ownerMe.id);
    expect(firstPage.body.items[0].sender.email).toBe(
      'owner-email-deliveries@example.com',
    );
    expect(firstPage.body.items[0].status).toBe('sent');
    expect(firstPage.body.items[0].metadata.type).toBe(
      'organization_invitation',
    );

    const secondPage = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 1,
        cursor: firstPage.body.meta.nextCursor as string,
      })
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.meta.limit).toBe(1);
    expect(secondPage.body.meta.hasNextPage).toBe(false);
    expect(secondPage.body.meta.nextCursor).toBeNull();

    const filteredByRecipient = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({
        limit: 10,
        to: 'first-delivery@example.com',
        status: 'sent',
      })
      .expect(200);

    expect(filteredByRecipient.body.items).toHaveLength(1);
    expect(filteredByRecipient.body.items[0].to).toBe(
      'first-delivery@example.com',
    );
    expect(filteredByRecipient.body.items[0].status).toBe('sent');
    expect(filteredByRecipient.body.meta.limit).toBe(10);
    expect(filteredByRecipient.body.meta.hasNextPage).toBe(false);
    expect(filteredByRecipient.body.meta.nextCursor).toBeNull();
  });
});
