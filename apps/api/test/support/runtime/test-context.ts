import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import type { PrismaClient } from '@prisma/client'

import { closeSharedTestApp, getSharedTestApp } from './test-app'
import { closeSharedTestDatabase, getSharedPrisma } from './test-database'

export type IntegrationTestContext = {
  app: NestFastifyApplication
  prisma: PrismaClient
}

export async function getTestContext(): Promise<IntegrationTestContext> {
  const [app, prisma] = await Promise.all([getSharedTestApp(), getSharedPrisma()])

  return {
    app,
    prisma
  }
}

export async function closeTestContext(): Promise<void> {
  await Promise.all([closeSharedTestApp(), closeSharedTestDatabase()])
}
