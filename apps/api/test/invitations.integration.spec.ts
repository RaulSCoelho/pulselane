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

  it('should create, preview, list and accept an invitation', async () => {
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

    const previewResponse = await request(app.getHttpServer())
      .get('/api/invitations/preview')
      .query({
        token: createInvitationResponse.body.token,
      })
      .expect(200);

    expect(previewResponse.body.email).toBe('invitee@example.com');
    expect(previewResponse.body.status).toBe('pending');
    expect(previewResponse.body.canAccept).toBe(true);
    expect(previewResponse.body.organizationName).toBe('Pulselane Labs');

    const emailDeliveriesResponse = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(emailDeliveriesResponse.body.items).toHaveLength(1);
    expect(emailDeliveriesResponse.body.items[0].organizationId).toBe(
      organizationId,
    );
    expect(emailDeliveriesResponse.body.items[0].sentBy).toBe(ownerMe.id);
    expect(emailDeliveriesResponse.body.items[0].sender.email).toBe(
      'owner@example.com',
    );
    expect(emailDeliveriesResponse.body.items[0].to).toBe(
      'invitee@example.com',
    );
    expect(emailDeliveriesResponse.body.items[0].status).toBe('sent');
    expect(emailDeliveriesResponse.body.items[0].metadata.type).toBe(
      'organization_invitation',
    );

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

  it('should reject invitation acceptance when authenticated user email does not match invitation email', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-mismatch@example.com',
      organizationName: 'Mismatch Workspace',
    });

    const ownerMe = await getCurrentUser(app, owner.accessToken);
    const organizationId = ownerMe.memberships[0].organization.id;

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'expected-invitee@example.com',
        role: 'member',
      })
      .expect(201);

    const otherUser = await signupAndGetAccessToken(app, {
      email: 'different-user@example.com',
      organizationName: 'Different Workspace',
    });

    const response = await request(app.getHttpServer())
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .send({
        token: createInvitationResponse.body.token,
      })
      .expect(403);

    expect(response.body.message).toBe(
      'You can only accept invitations sent to your own email',
    );
  });

  it('should revoke a pending invitation and block acceptance afterwards', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-revoke@example.com',
      organizationName: 'Revoke Workspace',
    });

    const ownerMe = await getCurrentUser(app, owner.accessToken);
    const organizationId = ownerMe.memberships[0].organization.id;

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee-revoke@example.com',
        role: 'member',
      })
      .expect(201);

    const revokeResponse = await request(app.getHttpServer())
      .patch(`/api/invitations/${createInvitationResponse.body.id}/revoke`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(200);

    expect(revokeResponse.body.status).toBe('revoked');

    const previewResponse = await request(app.getHttpServer())
      .get('/api/invitations/preview')
      .query({
        token: createInvitationResponse.body.token,
      })
      .expect(200);

    expect(previewResponse.body.status).toBe('revoked');
    expect(previewResponse.body.canAccept).toBe(false);

    const invitee = await signupAndGetAccessToken(app, {
      email: 'invitee-revoke@example.com',
      organizationName: 'Invitee Revoke Workspace',
    });

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${invitee.accessToken}`)
      .send({
        token: createInvitationResponse.body.token,
      })
      .expect(409);

    expect(acceptResponse.body.message).toBe('Invitation is no longer pending');
  });

  it('should resend a pending invitation and create another email delivery', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-resend@example.com',
      organizationName: 'Pulselane Resend Workspace',
    });

    const ownerMe = await getCurrentUser(app, owner.accessToken);
    const organizationId = ownerMe.memberships[0].organization.id;

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee-resend@example.com',
        role: 'member',
      })
      .expect(201);

    const originalToken = createInvitationResponse.body.token;

    const resendResponse = await request(app.getHttpServer())
      .post(`/api/invitations/${createInvitationResponse.body.id}/resend`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .expect(201);

    expect(resendResponse.body.status).toBe('pending');
    expect(resendResponse.body.token).toBeDefined();
    expect(resendResponse.body.token).not.toBe(originalToken);

    const emailDeliveriesResponse = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(emailDeliveriesResponse.body.items).toHaveLength(2);
    expect(emailDeliveriesResponse.body.items[0].to).toBe(
      'invitee-resend@example.com',
    );
    expect(emailDeliveriesResponse.body.items[1].to).toBe(
      'invitee-resend@example.com',
    );
  });
});
