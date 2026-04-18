# Backend deploy do Pulselane no Render

Este documento descreve o fluxo real de deploy do `apps/api` usando:

- GitHub Actions para CI
- Render como runtime da API
- Dockerfile versionado no repositório
- auto-deploy no Render em modo **After CI Checks Pass**

---

## 1. Arquitetura de deploy

O backend do Pulselane roda como **Web Service Docker** no Render.

O fluxo correto é:

1. commit sobe para o GitHub
2. o workflow `API CI` roda no GitHub Actions
3. o Render aguarda os checks do commit
4. se os checks passarem, o Render faz build e deploy da API

O Render deve estar configurado com:

- **Environment**: `Production`
- **Branch**: `main`
- **Auto-Deploy**: `After CI Checks Pass`
- **Dockerfile Path**: `apps/api/Dockerfile`

---

## 2. O que o Render usa do repositório

O Render precisa destes arquivos:

- `apps/api/Dockerfile`
- `apps/api/docker-entrypoint.sh`
- `.dockerignore`

---

## 3. Serviço no Render

Criar um **Web Service** no Render e conectar ao repositório `pulselane`.

### Configuração recomendada

- **Runtime**: Docker
- **Branch**: `main`
- **Dockerfile Path**: `apps/api/Dockerfile`
- **Auto-Deploy**: `After CI Checks Pass`

### Observação importante

O Render injeta `PORT` em runtime.  
O backend do Pulselane já lê `process.env.PORT`, então o serviço precisa ter:

```dotenv
PORT=10000
```

ou o valor que o Render estiver usando no serviço.

---

## 4. Variáveis de ambiente no Render

Todas as envs de produção devem ser cadastradas no painel do Render.

## App

```dotenv
PORT=10000
NODE_ENV=production
ALLOWED_CORS_ORIGINS=https://app.semicekinnovations.com
APP_WEB_URL=https://app.semicekinnovations.com
```

## Database

```dotenv
DATABASE_URL=postgresql://***:***@***.neon.tech/pulselane?sslmode=require&schema=public
```

## Observability

```dotenv
LOG_LEVEL=info
SLOW_REQUEST_THRESHOLD_MS=1000
SENTRY_ENABLED=true
SENTRY_DSN=***
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<commit-sha-ou-versao>
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Cookies

```dotenv
COOKIE_SECRET=***
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_DOMAIN=.semicekinnovations.com
```

## Auth

```dotenv
JWT_ACCESS_SECRET=***
JWT_REFRESH_SECRET=***
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
```

## Email

```dotenv
EMAIL_FROM_NAME=Pulselane
EMAIL_FROM_ADDRESS=no-reply@semicekinnovations.com
EMAIL_TRANSPORT=smtp
EMAIL_QUEUE_DRAIN_DELAY_MS=30000
EMAIL_QUEUE_STALLED_INTERVAL_MS=120000
EMAIL_SMTP_HOST=***
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=***
EMAIL_SMTP_PASSWORD=***
```

## Stripe

Se o billing ainda não estiver ativo em produção:

```dotenv
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
```

Se o billing Stripe estiver ativo:

```dotenv
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=***
STRIPE_WEBHOOK_SECRET=***
STRIPE_PRICE_STARTER=price_***
STRIPE_PRICE_GROWTH=price_***
```

## Redis

```dotenv
REDIS_ENABLED=true
REDIS_REQUIRED=true
REDIS_URL=rediss://default:***@***.upstash.io:6379
```

---

## 5. CI obrigatória antes do deploy

O Render só deve deployar depois do workflow `API CI` passar.

O workflow precisa validar pelo menos:

* install
* prisma generate
* lint
* typecheck
* build
* integration tests

Se o CI falhar, o Render não deve deployar.

---

## 6. Estratégia de runtime

O container da API faz:

1. `prisma migrate deploy`
2. `node dist/main.js`

Isso garante que migrations pendentes sejam aplicadas antes do boot da API.

---

## 7. Validação pós-deploy

Depois que o Render concluir o deploy, validar:

```bash
curl https://<api-public-url>/health
curl https://<api-public-url>/readiness
curl https://<api-public-url>/metrics
```

Também validar:

* login
* refresh token
* endpoint autenticado simples
* conexão com banco
* readiness com Redis ativo

---

## 8. Checklist de produção

Antes do primeiro deploy real, confirmar:

* [ ] serviço Render criado
* [ ] branch `main` conectada
* [ ] auto-deploy em `After CI Checks Pass`
* [ ] todas as envs cadastradas
* [ ] Neon configurado
* [ ] Upstash configurado
* [ ] domínio do SMTP autenticado
* [ ] CI verde no GitHub Actions