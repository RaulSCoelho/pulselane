/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

type SignupTestContextInput = {
  app: NestFastifyApplication;
  prisma: PrismaClient;
  name?: string;
  email?: string;
  password?: string;
  organizationName?: string;
};

type SignupTestContextResult = {
  accessToken: string;
  userId: string;
  organizationId: string;
  email: string;
};

export async function signupAndGetContext({
  app,
  prisma,
  name = 'Raul',
  email = `user-${Date.now()}@example.com`,
  password = '123456',
  organizationName = `Workspace ${Date.now()}`,
}: SignupTestContextInput): Promise<SignupTestContextResult> {
  const signupResponse = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({
      name,
      email,
      password,
      organizationName,
    })
    .expect(201);

  const accessToken = signupResponse.body.accessToken as string;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      memberships: true,
    },
  });

  if (!user || user.memberships.length === 0) {
    throw new Error('Failed to resolve test user organization context');
  }

  return {
    accessToken,
    userId: user.id,
    organizationId: user.memberships[0].organizationId,
    email,
  };
}
