# Pulselane

Pulselane is a multi-tenant operations SaaS focused on managing organizations, memberships, clients, projects, tasks, invitations, audit logs, and email delivery history.

This repository is structured as a pnpm monorepo.

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

## Current status

### API

The API is the most mature part of the project and currently includes:

* authentication with access token + refresh token
* per-device session management
* multi-tenant organization scoping
* memberships and role-based access
* clients CRUD
* projects CRUD
* tasks CRUD
* audit logs
* organization invitations
* email delivery tracking
* Swagger docs

### Web

The web app is still in an initial scaffold stage and does not yet reflect the real product flows.

## Tech stack

### Monorepo

* pnpm 10

### API

* NestJS
* Fastify
* Prisma
* PostgreSQL
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

## Product architecture

Pulselane is designed as a multi-tenant system where `organization` is the main boundary for access control and data isolation.

Main concepts:

* a user can belong to multiple organizations
* a membership links a user to an organization with a role
* business resources are scoped by organization
* most organization-scoped endpoints require the `x-organization-id` header
* audit logs track mutation events
* invitations allow users to join organizations
* email deliveries are persisted for traceability

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
* enforce organization roles

### Core resources

* clients
* projects
* tasks

### Collaboration

* invitations
* invitation preview
* invitation acceptance
* resend/revoke invitation
* email delivery history

## Local development

## Requirements

* Node.js 20.9+
* pnpm 10.x
* Docker
* Docker Compose

## Setup

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

See `.env.example` in the `apps/api` directory.

## Important notes

* `apps/api` is currently the source of truth for product behavior.
* `apps/web` still needs to be aligned with the actual backend flows.
* Redis is available locally, but is not yet a required runtime dependency for the current API flows.
* CI/CD is not yet defined at the repository level.
* The next major step after this foundation is to validate migrations, tests, and then define the first real web flows against the current API.

## Immediate priorities

1. stabilize repository setup and docs
2. validate migrations and test coverage
3. define the first web-to-api contract
4. implement the initial product frontend flows