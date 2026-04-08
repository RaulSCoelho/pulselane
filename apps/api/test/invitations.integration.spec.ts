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

describe('Invitations integration', () => {
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

  it('should create, list and accept an invitation', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner@example.com',
      organizationName: 'Pulselane Labs',
    });

    const ownerMe = await getCurrentUser(app, owner.accessToken);
    const organizationId = ownerMe.memberships[0].organization.id;

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee@example.com',
        role: 'member',
      })
      .expect(201);

    expect(createInvitationResponse.body.email).toBe('invitee@example.com');
    expect(createInvitationResponse.body.status).toBe('pending');
    expect(createInvitationResponse.body.token).toBeDefined();

    const listResponse = await request(app.getHttpServer())
      .get('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.meta.total).toBe(1);

    const invitee = await signupAndGetAccessToken(app, {
      email: 'invitee@example.com',
      organizationName: 'Other Workspace',
    });

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${invitee.accessToken}`)
      .send({
        token: createInvitationResponse.body.token,
      })
      .expect(201);

    expect(acceptResponse.body.status).toBe('accepted');

    const inviteeMe = await getCurrentUser(app, invitee.accessToken);
    expect(inviteeMe.memberships).toHaveLength(2);
  });
});
