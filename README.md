# Pulselane

Pulselane is a multi-tenant operations SaaS built to manage organizations, memberships, clients, projects, tasks, invitations, audit logs, billing state, email delivery history, and operational health endpoints in a single product.

## Monorepo structure

```txt
.
├── apps
│   ├── api
│   └── web
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Product scope

Pulselane is designed around a single tenant boundary: `organization`.

Core platform capabilities:

* authentication with access token and refresh token rotation
* per-device session management
* multi-tenant organization scoping
* role-based access through memberships
* clients CRUD
* projects CRUD
* tasks CRUD
* comments
* audit logs
* organization invitations
* email delivery tracking
* billing state persistence
* health, readiness, warmup, and heartbeat endpoints

## Architecture

### API

The API is a NestJS modular monolith responsible for:

* authentication and authorization
* tenant isolation
* business rules
* persistence
* auditability
* billing state
* health and dependency checks

### Web

The web application is the product UI for authentication, tenant selection, and operational flows across clients, projects, tasks, invitations, and billing-aware product usage.

### Database

PostgreSQL is the system of record for:

* users
* organizations
* memberships
* auth sessions
* clients
* projects
* tasks
* comments
* audit logs
* invitations
* billing state
* billing webhook events
* email deliveries
* system heartbeats

### Redis

Redis is available for runtime support, dependency checks, and future operational extensions.

## Tech stack

### Monorepo

* pnpm 10

### API

* NestJS
* Fastify
* Prisma
* PostgreSQL
* Redis
* JWT
* Cookies
* Swagger
* Vitest

### Web

* Next.js
* React
* Tailwind CSS

### Local infrastructure

* PostgreSQL
* Redis

## Main API flows

### Authentication

* signup
* login
* refresh token rotation
* logout current session
* logout all sessions
* list sessions
* current user profile

### Organization and access

* list current user organizations
* resolve current organization through `x-organization-id`
* enforce membership roles per organization

### Core resources

* clients
* projects
* tasks
* comments
* audit logs

### Collaboration

* invitations
* invitation preview
* invitation acceptance
* invitation resend
* invitation revoke
* email delivery history

### Health and infrastructure

* `GET /health`
* `GET /readiness`
* `GET /db-warmup`
* `GET /db-heartbeat`
* `GET /redis-health`

## Local development

### Requirements

* Node.js 20.9+
* pnpm 10.x
* Docker

### Environment files

API:

```bash
cp apps/api/.env.example apps/api/.env
```

Web:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Setup

1. Install dependencies

```bash
pnpm install
```

2. Start local dependencies

```bash
docker compose up -d
```

3. Run Prisma migrations

```bash
pnpm db:migrate:dev
```

4. Seed the database

```bash
pnpm db:seed
```

5. Start the API

```bash
pnpm dev:api
```

6. Start the web app

```bash
pnpm dev:web
```

## Main scripts

### Root

```bash
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm build
pnpm build:api
pnpm build:web
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm db:generate
pnpm db:migrate:dev
pnpm db:migrate:prod
pnpm db:seed
```

### API

```bash
pnpm --dir apps/api start:dev
pnpm --dir apps/api build
pnpm --dir apps/api test
pnpm --dir apps/api test:watch
pnpm --dir apps/api test:coverage
pnpm --dir apps/api db:generate
pnpm --dir apps/api db:migrate:dev
pnpm --dir apps/api db:migrate:prod
pnpm --dir apps/api db:seed
```

### Web

```bash
pnpm --dir apps/web dev
pnpm --dir apps/web build
pnpm --dir apps/web start
```

## API docs

When the API is running, Swagger is available at:

```txt
http://localhost:3001/docs
```

## Production environment review

### API variables

The API environment file lives at:

```txt
apps/api/.env
```

Critical production rules:

* `NODE_ENV=production`
* `ALLOWED_CORS_ORIGINS` must contain only trusted HTTPS origins, or a single root domain pattern like `.example.com`
* `COOKIE_SECURE=true` in production
* `COOKIE_SAME_SITE=none` only when the web app is hosted on a different site and HTTPS is enabled
* `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be long random secrets
* `SENTRY_ENABLED=true` requires a valid `SENTRY_DSN`
* `STRIPE_ENABLED=true` requires all Stripe keys and price IDs
* `EMAIL_TRANSPORT=smtp` requires SMTP host, port, user, and password
* `REDIS_ENABLED=true` requires a valid `REDIS_URL`
* `REDIS_REQUIRED=true` should be used only when Redis is considered a hard production dependency

### Web variables

The web environment file lives at:

```txt
apps/web/.env.local
```

Current public variable:

* `NEXT_PUBLIC_API_BASE_URL`

Production example:

```txt
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

## Platform guarantees

Pulselane enforces:

* organization-scoped data access
* role-based mutation rules
* auditable operational changes
* refresh session revocation and rotation
* explicit health and readiness checks
* provider-compatible database heartbeat support through persisted `system_heartbeats`