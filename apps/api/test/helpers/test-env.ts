import 'dotenv/config';

process.env.NODE_ENV = 'test';

const DEFAULTS = {
  PORT: '3001',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  COOKIE_SECRET: 'test-cookie-secret',
  ALLOWED_CORS_ORIGINS: 'http://localhost:3000',
} satisfies Partial<NodeJS.ProcessEnv>;

for (const [key, value] of Object.entries(DEFAULTS)) {
  process.env[key] ??= value;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for integration tests');
}

function buildTestDbName(pathname: string, workerId: string) {
  const base = pathname.replace(/^\//, '');
  const withSuffix = base.endsWith('_test') ? base : `${base}_test`;
  return `${withSuffix}_${workerId}`;
}

export function buildWorkerDatabaseUrl() {
  const workerId = process.env.VITEST_WORKER_ID ?? '1';
  const url = new URL(process.env.DATABASE_URL!);
  const name = buildTestDbName(url.pathname, workerId);

  // Each Vitest worker gets its own database name so tests can run in parallel
  // without sharing transactional state.
  url.pathname = `/${name}`;
  url.search = '';

  return { name, url: url.toString() };
}
