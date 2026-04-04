/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

type SignupResult = {
  accessToken: string;
};

export async function signupAndGetAccessToken(
  app: NestFastifyApplication,
  input?: {
    name?: string;
    email?: string;
    password?: string;
    organizationName?: string;
  },
): Promise<SignupResult> {
  const payload = {
    name: input?.name ?? 'Raul Semicek',
    email: input?.email ?? `raul-${Date.now()}@example.com`,
    password: input?.password ?? '123456',
    organizationName: input?.organizationName ?? 'Pulselane Labs',
  };

  const response = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send(payload)
    .expect(201);

  return {
    accessToken: response.body.accessToken,
  };
}

export async function getCurrentUser(
  app: NestFastifyApplication,
  accessToken: string,
) {
  const response = await request(app.getHttpServer())
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  return response.body;
}
