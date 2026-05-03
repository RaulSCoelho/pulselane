# Pulselane API

`apps/api` is a NestJS + Fastify API for a multi-tenant operations SaaS. It manages:

- user signup/login and per-device sessions
- organization membership and request scoping
- organization-scoped clients, projects, and tasks
- audit logs for mutating actions

The implementation uses Prisma with PostgreSQL, JWTs for authentication, and cookies for refresh-session continuity.

## Architecture Overview

The API is assembled in [`src/app.module.ts`](./src/app.module.ts):

- `AuthModule`: signup, login, token refresh, current-user lookup, session listing/logout
- `OrganizationModule`: organization listing plus current organization context resolution
- `ClientsModule`: organization-scoped client CRUD
- `ProjectsModule`: organization-scoped project CRUD
- `TasksModule`: organization-scoped task CRUD
- `AuditLogsModule`: read audit history and write audit entries from other modules
- `PrismaModule`: global Prisma client

The common runtime shape is:

1. `src/main.ts` bootstraps Nest on Fastify, registers cookie support, CORS, validation, Swagger, and the global exception filter.
2. `AuthModule` installs a global access-token guard, so routes are private unless explicitly marked with `@Auth({ mode: 'public' })` or `optional`.
3. Controllers that operate inside a tenant use `OrganizationContextGuard`, which reads `x-organization-id`, verifies membership, and attaches both the current organization and membership to the request.
4. `OrganizationRolesGuard` optionally enforces role-based authorization after organization context has been resolved.
5. Services orchestrate business checks and audit logging.
6. Repositories keep the Prisma queries and includes localized.

## Request and Data Flow

### Authentication flow

- `POST /api/auth/signup`
  - creates a user, organization, and owner membership in a single Prisma transaction
  - immediately logs the user in after the transaction succeeds
- `POST /api/auth/login`
  - validates credentials
  - upserts an `auth_sessions` row keyed by `(userId, deviceId)`
  - returns a bearer access token
  - sets:
    - `refresh_token` cookie scoped to `/api/auth`
    - `device_id` cookie scoped to `/`
- `POST /api/auth/refresh`
  - reads both cookies
  - validates the refresh JWT and device binding
  - rotates the stored refresh-token hash for the existing session
  - returns a new access token and refresh cookie
- protected routes
  - expect `Authorization: Bearer <access token>`
  - validate the token and also re-check the backing session state

### Organization scoping flow

Most business endpoints require:

- a valid access token
- `x-organization-id`
- membership in that organization

The resolved organization and membership are then exposed through decorators such as `@CurrentOrganization()` and `@CurrentOrganizationMembership()`.

### CRUD and audit flow

Clients, projects, and tasks follow the same pattern:

1. Controller applies auth, org context, and role requirements.
2. Service verifies cross-entity constraints.
3. Repository performs the Prisma write/read.
4. Service writes an audit log entry for create/update/delete operations.

Cross-entity checks visible in code:

- projects can only reference clients from the same organization
- tasks can only reference projects from the same organization
- task assignees must be members of the same organization
- viewers can read org-scoped resources but cannot create or update them
- delete operations for clients/projects/tasks are restricted to `owner` and `admin`

## Module Responsibilities

### `src/modules/auth`

- `auth.controller.ts`: HTTP entrypoints for signup/login/me/refresh/logout/session listing
- `auth.service.ts`: user creation/login orchestration, session rotation, session listing
- `session.service.ts`: session lifecycle rules such as expiry, revocation, compromise handling, and device binding
- `token.service.ts`: JWT signing/verification and refresh-expiry calculation
- `cookie.service.ts`: refresh/device cookie settings derived from env config
- `strategies/*`: Passport strategies for bearer access tokens and cookie refresh tokens
- `guards/*`: global access guard plus refresh guard

Notable behavior:

- access tokens are stateless JWTs, but still require the referenced session to remain valid
- refresh tokens are not stored directly; the database stores a bcrypt hash
- if a refresh token or device ID does not match the stored session, the session is marked revoked and compromised

### `src/modules/organization`

- lists a user’s organizations
- resolves the current organization from `x-organization-id`
- exposes role-based authorization guard support

### `src/modules/clients`

- organization-scoped client CRUD
- text search across `name`, `email`, and `companyName`
- paginated list responses

### `src/modules/projects`

- organization-scoped project CRUD
- validates `clientId` against the current organization before writes and filtered reads
- returns a lightweight embedded client summary with project responses

### `src/modules/tasks`

- organization-scoped task CRUD
- validates `projectId` and optional assignee membership
- returns lightweight embedded project and assignee summaries
- supports filtering by project, assignee, status, and priority

### `src/modules/audit-logs`

- stores create/update/delete audit records for clients, projects, and tasks
- supports paginated filtering by entity, actor, and action

### `src/modules/user` and `src/modules/membership`

- `UserService` owns unique-email enforcement and password hashing
- `MembershipService` centralizes the “user must belong to this organization” check and can raise either `403` or `404` depending on caller intent

## Database Model

The Prisma schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma).

Core entities:

- `User`
- `AuthSession`
- `Organization`
- `Membership`
- `Client`
- `Project`
- `Task`
- `AuditLog`

Important constraints and implications:

- the system is multi-tenant by `organizationId`
- membership is unique per `(userId, organizationId)`
- auth sessions are unique per `(userId, deviceId)`
- several string fields use PostgreSQL `citext`, so uniqueness and lookups are case-insensitive at the database layer
- deletes cascade from users/organizations into dependent records, except task assignees which use `SetNull`

## Configuration and Environment

Environment parsing is defined in:

- [`src/config/env.validation.ts`](./src/config/env.validation.ts)
- [`src/config/env.config.ts`](./src/config/env.config.ts)

Required runtime variables:

- `COOKIE_SECRET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Common variables:

- `PORT`
- `NODE_ENV`
- `ALLOWED_CORS_ORIGINS`
- `TRUST_PROXY` to let Fastify derive `request.ip` from trusted `x-forwarded-*` headers
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `COOKIE_DOMAIN`
- `ACCESS_TOKEN_TTL_SECONDS`
- `REFRESH_TOKEN_TTL_DAYS`
- `DATABASE_URL` for Prisma/PostgreSQL

Notes visible from the implementation:

- CORS origins are loaded from `ALLOWED_CORS_ORIGINS` as a comma-separated list
- refresh cookies are scoped to `/api/auth`; the device cookie is broader so auth endpoints can reuse the same device binding
- `COOKIE_SECURE` defaults to `true` only in production when the env var is absent
- `COOKIE_SAME_SITE` currently accepts `lax` or `none`

## Local Development

From the repo root:

```bash
pnpm install
docker compose up -d
pnpm --filter api prisma migrate deploy
pnpm --filter api db:seed
pnpm --filter api start:dev
```

Useful scripts from [`package.json`](./package.json):

- `pnpm --filter api build`
- `pnpm --filter api start`
- `pnpm --filter api start:dev`
- `pnpm --filter api start:prod`
- `pnpm --filter api lint`
- `pnpm --filter api test`
- `pnpm --filter api test:watch`
- `pnpm --filter api test:integration`
- `pnpm --filter api db:seed`

Swagger is served at `/docs`, and the HTTP API is prefixed with `/api`.

## Testing

Integration tests live in [`test/`](./test) and run with [`vitest.integration.config.mts`](./vitest.integration.config.mts).

The test setup:

- loads defaults from `test/helpers/test-env.ts`
- requires a base `DATABASE_URL`
- derives a per-worker database name by appending `_test_<workerId>`
- runs `prisma migrate deploy` against that worker database
- boots a Fastify-backed Nest app with the same global prefix and validation pipe used in production bootstrap
- drops the worker database during teardown

This means integration tests expect a PostgreSQL server to be reachable, but they isolate each Vitest worker at the database level.

## Docker and npm Notes

The repo-level [`../../docker-compose.yml`](../../docker-compose.yml) provides local PostgreSQL and Redis containers. In the current `apps/api` implementation:

- PostgreSQL is required for Prisma
- Redis is available for the wider repo, but `apps/api` does not currently read Redis config or depend on it at runtime

The repo-level [`../../.npmrc`](../../.npmrc) enables auto-installing peer dependencies and relaxes strict peer enforcement, which helps keep the workspace install friction low across packages.

## Seed Data

[`prisma/seed.ts`](./prisma/seed.ts) loads a sample multi-tenant dataset:

- 4 users
- 4 organizations
- owner memberships
- clients, projects, tasks, auth sessions, and audit logs

It is designed to be idempotent through Prisma `upsert` calls and uses a shared default password of `123456` for seeded users.
