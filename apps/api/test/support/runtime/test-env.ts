import 'dotenv/config'

process.env.NODE_ENV = 'test'

const DEFAULTS = {
  PORT: '3001',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  COOKIE_SECRET: 'test-cookie-secret',
  ALLOWED_CORS_ORIGINS: 'http://localhost:3000',
  TRUST_PROXY: 'true'
} satisfies Partial<NodeJS.ProcessEnv>

for (const [key, value] of Object.entries(DEFAULTS)) {
  process.env[key] ??= value
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for integration tests')
}

function buildSharedTestDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl)
  const baseName = url.pathname.replace(/^\//, '')

  if (!baseName) {
    throw new Error('Database name not found in DATABASE_URL.')
  }

  url.pathname = `/${baseName.endsWith('_test') ? baseName : `${baseName}_test`}`
  url.search = ''

  return url.toString()
}

export const SHARED_TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? buildSharedTestDatabaseUrl(process.env.DATABASE_URL)

process.env.DATABASE_URL = SHARED_TEST_DATABASE_URL
