/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import './helpers/test-env';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';

import {
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/prisma-test-utils';
import {
  getCurrentUser,
  signupAndGetAccessToken,
} from './helpers/auth-helpers';
import { AppModule } from '@/app.module';
import { EnvConfig } from '@/config/env.config';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { EMAIL_PROVIDER } from '@/modules/email/email.constants';

async function createTestAppWithFailingEmailProvider(): Promise<NestFastifyApplication> {
  const failingEmailProvider = {
    send: vi.fn().mockRejectedValue(new Error('SMTP unavailable')),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EMAIL_PROVIDER)
    .useValue(failingEmailProvider)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    {
      rawBody: true,
    },
  );

  const configService = app.get(ConfigService<EnvConfig, true>);
  const cookieSecret = configService.getOrThrow('cookieSecret', {
    infer: true,
  });
  const allowedCorsOrigins = configService.getOrThrow('allowedCorsOrigins', {
    infer: true,
  });

  await app.register(fastifyCookie, {
    secret: cookieSecret,
  });

  app.enableCors({
    origin: allowedCorsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

describe('Invitations email failure integration', () => {
  let app: NestFastifyApplication;
  let prisma: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    app = await createTestAppWithFailingEmailProvider();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase(prisma);
  });

  it('should persist invitation and failed email delivery when provider fails', async () => {
    const owner = await signupAndGetAccessToken(app, {
      email: 'owner-email-failure@example.com',
      organizationName: 'Email Failure Workspace',
    });

    const ownerMe = await getCurrentUser(app, owner.accessToken);
    const organizationId = ownerMe.memberships[0].organization.id;

    const createInvitationResponse = await request(app.getHttpServer())
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .send({
        email: 'invitee-email-failure@example.com',
        role: 'member',
      })
      .expect(500);

    expect(createInvitationResponse.body.message).toBe(
      'Unexpected internal server error',
    );

    const listInvitationsResponse = await request(app.getHttpServer())
      .get('/api/invitations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(listInvitationsResponse.body.items).toHaveLength(1);
    expect(listInvitationsResponse.body.items[0].email).toBe(
      'invitee-email-failure@example.com',
    );
    expect(listInvitationsResponse.body.items[0].status).toBe('pending');

    const emailDeliveriesResponse = await request(app.getHttpServer())
      .get('/api/email-deliveries')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('x-organization-id', organizationId)
      .query({ page: 1, pageSize: 10 })
      .expect(200);

    expect(emailDeliveriesResponse.body.items).toHaveLength(1);
    expect(emailDeliveriesResponse.body.items[0].to).toBe(
      'invitee-email-failure@example.com',
    );
    expect(emailDeliveriesResponse.body.items[0].status).toBe('failed');
    expect(emailDeliveriesResponse.body.items[0].error).toBe(
      'SMTP unavailable',
    );
    expect(emailDeliveriesResponse.body.items[0].metadata.type).toBe(
      'organization_invitation',
    );
  });
});
