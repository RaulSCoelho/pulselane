/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

describe('Auth integration', () => {
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

  it('should signup, create organization membership and return current user', async () => {
    const signupResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Raul',
        email: 'raul@example.com',
        password: '123456',
        organizationName: 'Pulselane Labs',
      })
      .expect(201);

    expect(signupResponse.body.accessToken).toBeTypeOf('string');
    expect(signupResponse.headers['set-cookie']).toBeTruthy();

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signupResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe('raul@example.com');
    expect(meResponse.body.memberships).toHaveLength(1);
    expect(meResponse.body.memberships[0].role).toBe('owner');
    expect(meResponse.body.memberships[0].organization.name).toBe(
      'Pulselane Labs',
    );
  });
});
