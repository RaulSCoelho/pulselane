/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { PrismaClient } from '@prisma/client'
import request from 'supertest'

type SignupInput = {
  name?: string
  email?: string
  password?: string
  organizationName?: string
}

type SignupResult = {
  accessToken: string
  email: string
}

type SignupTestContextInput = SignupInput & {
  app: NestFastifyApplication
  prisma: PrismaClient
}

type SignupTestContextResult = {
  accessToken: string
  userId: string
  organizationId: string
  email: string
}

export async function signupAndGetAccessToken(app: NestFastifyApplication, input?: SignupInput): Promise<SignupResult> {
  const email = input?.email ?? `user-${Date.now()}-${Math.random()}@example.com`

  const response = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({
      name: input?.name ?? 'Raul',
      email,
      password: input?.password ?? '123456',
      organizationName: input?.organizationName ?? `Workspace ${Date.now()}`
    })
    .expect(201)

  return {
    accessToken: response.body.accessToken as string,
    email
  }
}

export async function getCurrentUser(app: NestFastifyApplication, accessToken: string) {
  const response = await request(app.getHttpServer())
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200)

  return response.body
}

export async function signupAndGetContext({
  app,
  prisma,
  name = 'Raul',
  email = `user-${Date.now()}-${Math.random()}@example.com`,
  password = '123456',
  organizationName = `Workspace ${Date.now()}`
}: SignupTestContextInput): Promise<SignupTestContextResult> {
  const signupResponse = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({
      name,
      email,
      password,
      organizationName
    })
    .expect(201)

  const accessToken = signupResponse.body.accessToken as string

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    include: {
      memberships: true
    }
  })

  if (!user || user.memberships.length === 0) {
    throw new Error('Failed to resolve test user organization context')
  }

  return {
    accessToken,
    userId: user.id,
    organizationId: user.memberships[0].organizationId,
    email
  }
}
