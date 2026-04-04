import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '3001';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'test-cookie-secret';
process.env.ALLOWED_CORS_ORIGINS =
  process.env.ALLOWED_CORS_ORIGINS ?? 'http://localhost:3000';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for integration tests');
}

function getDbTestName(baseName: string, workerId: string) {
  const clean = baseName.replace('/', '');
  const base = clean.endsWith('_test') ? clean : `${clean}_test`;
  return `${base}_${workerId}`;
}

export function buildWorkerDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const workerId = process.env.VITEST_WORKER_ID ?? '1';
  const url = new URL(process.env.DATABASE_URL);
  const name = getDbTestName(url.pathname, workerId);

  url.pathname = `/${name}`;
  url.search = '';

  return { name, url: url.toString() };
}
