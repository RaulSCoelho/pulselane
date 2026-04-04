import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { buildWorkerDatabaseUrl } from './test-env';

export async function setupTestDatabase() {
  const { url } = buildWorkerDatabaseUrl();

  process.env.DATABASE_URL = url;

  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });

  const prisma = new PrismaClient();
  await prisma.$connect();

  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient) {
  await prisma.$disconnect();

  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.replace('/', '');

  url.pathname = '/postgres';

  execSync(
    `psql "${url.toString()}" -c "
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbName}'
        AND pid <> pg_backend_pid();
    "`,
    { stdio: 'inherit' },
  );

  execSync(`psql "${url.toString()}" -c "DROP DATABASE IF EXISTS ${dbName};"`, {
    stdio: 'inherit',
  });
}
