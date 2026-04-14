import { PrismaClient } from '@prisma/client'
import { execFileSync } from 'node:child_process'

import { SHARED_TEST_DATABASE_URL } from './test-env'

const PROTECTED_DATABASES = new Set(['postgres', 'template0', 'template1'])
const VALID_DB_NAME = /^[a-zA-Z0-9_-]+$/

const TRUNCATE_TABLES = [
  'billing_webhook_events',
  'organization_billing',
  'email_deliveries',
  'organization_invitations',
  'audit_logs',
  'tasks',
  'projects',
  'clients',
  'memberships',
  'auth_sessions',
  'organizations',
  'users'
] as const

let prisma: PrismaClient | null = null
let isPrepared = false

function getDatabaseName(databaseUrl: string): string {
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, '')

  if (!dbName) {
    throw new Error('Database name not found in DATABASE_URL.')
  }

  if (PROTECTED_DATABASES.has(dbName)) {
    throw new Error(`Refusing to use protected database "${dbName}".`)
  }

  if (!VALID_DB_NAME.test(dbName)) {
    throw new Error(`Invalid database name "${dbName}".`)
  }

  return dbName
}

function getAdminDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl)
  url.pathname = '/postgres'
  return url.toString()
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function createPrismaClient(url: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  })
}

async function ensureDatabaseExists(): Promise<void> {
  const dbName = getDatabaseName(SHARED_TEST_DATABASE_URL)
  const admin = createPrismaClient(getAdminDatabaseUrl(SHARED_TEST_DATABASE_URL))

  try {
    await admin.$connect()

    const existing = await admin.$queryRaw<Array<{ datname: string }>>`
      SELECT datname
      FROM pg_database
      WHERE datname = ${dbName}
    `

    if (existing.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(dbName)};`)
    }
  } finally {
    await admin.$disconnect()
  }
}

function runMigrations(): void {
  execFileSync('pnpm', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: SHARED_TEST_DATABASE_URL
    }
  })
}

function buildTruncateStatement(): string {
  const quotedTables = TRUNCATE_TABLES.map(table => quoteIdentifier(table)).join(', ')
  return `TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE;`
}

export async function ensureSharedTestDatabase(): Promise<PrismaClient> {
  if (isPrepared && prisma) {
    return prisma
  }

  await ensureDatabaseExists()
  runMigrations()

  prisma ??= createPrismaClient(SHARED_TEST_DATABASE_URL)
  await prisma.$connect()
  await prisma.$executeRawUnsafe(buildTruncateStatement())

  isPrepared = true

  return prisma
}

export async function resetSharedTestDatabase(): Promise<void> {
  const client = await ensureSharedTestDatabase()
  await client.$executeRawUnsafe(buildTruncateStatement())
}

export async function getSharedPrisma(): Promise<PrismaClient> {
  return ensureSharedTestDatabase()
}

export async function closeSharedTestDatabase(): Promise<void> {
  if (!prisma) {
    return
  }

  await prisma.$disconnect()
  prisma = null
  isPrepared = false
}
