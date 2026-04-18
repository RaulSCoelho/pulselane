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
* Docker Compose

### Setup

1. Install dependencies

```bash
pnpm install
```

2. Copy environment variables

```bash
cp .env.example .env
```

3. Start local dependencies

```bash
docker compose up -d
```

4. Run Prisma migrations

```bash
pnpm --filter api prisma migrate deploy
```

5. Seed the database

```bash
pnpm --filter api db:seed
```

6. Start the API

```bash
pnpm dev:api
```

7. Start the web app

```bash
pnpm dev:web
```

## Main scripts

### Root

```bash
pnpm dev:api
pnpm dev:web
pnpm build:api
pnpm build:web
```

### API

```bash
pnpm --filter api start:dev
pnpm --filter api build
pnpm --filter api test
pnpm --filter api test:integration
pnpm --filter api db:seed
pnpm --filter api prisma migrate deploy
```

### Web

```bash
pnpm --filter web dev
pnpm --filter web build
```

## API docs

When the API is running, Swagger is available at:

```txt
http://localhost:3001/docs
```

## Environment variables

See `.env.example` in `apps/api`.

## Platform guarantees

Pulselane enforces:

* organization-scoped data access
* role-based mutation rules
* auditable operational changes
* refresh session revocation and rotation
* explicit health and readiness checks
* provider-compatible database heartbeat support through persisted `system_heartbeats`

## 7. Após o código

### Como rodar e validar

1. Criar a migration SQL na pasta indicada.
2. Adicionar o model no `schema.prisma`.
3. Substituir `main.ts`, `health.controller.ts`, `health.service.ts` e `README.md`.
4. Rodar:

```bash
pnpm --filter api prisma generate
pnpm --filter api prisma migrate dev --name add-system-heartbeats
pnpm --filter api test
pnpm --filter api build
pnpm --filter web build
```