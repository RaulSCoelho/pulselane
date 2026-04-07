import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { buildWorkerDatabaseUrl } from './test-env';

const PROTECTED_DATABASES = new Set(['postgres', 'template0', 'template1']);
const VALID_DB_NAME = /^[a-zA-Z0-9_-]+$/;

function getDatabaseName(databaseUrl: string): string {
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, '');

  if (!dbName) {
    throw new Error('Database name not found in DATABASE_URL.');
  }
  if (PROTECTED_DATABASES.has(dbName)) {
    throw new Error(`Refusing to drop protected database "${dbName}".`);
  }
  if (!VALID_DB_NAME.test(dbName)) {
    throw new Error(`Invalid database name "${dbName}".`);
  }

  return dbName;
}

function getAdminDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function createPrismaClient(url: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url } } });
}

export async function setupTestDatabase() {
  const { url } = buildWorkerDatabaseUrl();

  process.env.DATABASE_URL = url;

  execFileSync('pnpm', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: process.env,
  });

  const prisma = createPrismaClient(url);
  await prisma.$connect();

  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient) {
  await prisma.$disconnect();

  const databaseUrl = process.env.DATABASE_URL!;
  const dbName = getDatabaseName(databaseUrl);
  const adminUrl = getAdminDatabaseUrl(databaseUrl);
  const client = createPrismaClient(adminUrl);

  try {
    await client.$connect();

    await client.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbName}'
        AND pid <> pg_backend_pid();
    `);

    await client.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)};`,
    );
  } finally {
    await client.$disconnect();
  }
}
