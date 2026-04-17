# Backend deploy do Pulselane

Este fluxo versiona o deploy do `apps/api` com:

- CI em GitHub Actions
- build e push da imagem para GHCR
- deploy remoto por SSH
- execução via Docker Compose no servidor

## 1. Pré-requisitos do servidor

O servidor de produção precisa ter:

- Docker
- Docker Compose plugin
- acesso de rede ao banco PostgreSQL
- acesso de rede ao Redis, se Redis estiver habilitado
- porta da API liberada no firewall ou reverse proxy já configurado

## 2. Arquivos que devem existir no servidor

No diretório configurado em `DEPLOY_PATH`, o workflow envia:

- `docker-compose.prod.yml`
- `deploy-api.sh`

Você precisa criar manualmente o arquivo:

- `.env`

Use `infra/docker/api/.env.example` como base.

## 3. Secrets necessários no GitHub

Configurar estes secrets no repositório:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `GHCR_USERNAME`
- `GHCR_TOKEN`

### Observações

`GHCR_TOKEN` deve ter pelo menos permissão de leitura em packages no GHCR.
`DEPLOY_SSH_KEY` deve ser a chave privada com acesso ao servidor.

## 4. Comportamento da pipeline

### API CI

Executa:

- install
- prisma generate
- lint
- typecheck
- build
- tests

### API Deploy

Dispara quando:

- `API CI` conclui com sucesso em `main`
- ou manualmente por `workflow_dispatch`

O deploy faz:

1. build da imagem da API
2. push para GHCR
3. upload do compose e script para o servidor
4. login no GHCR no servidor
5. `docker compose pull`
6. `docker compose up -d`

## 5. Estratégia de runtime

A imagem da API executa:

1. `prisma migrate deploy`
2. `node dist/main.js`

Isso garante que migrations pendentes sejam aplicadas antes do boot da aplicação.

## 6. O que este deploy não faz

Este passo não provisiona:

- PostgreSQL
- Redis
- reverse proxy
- TLS/HTTPS
- backup de banco

Isso é intencional. O deploy da API deve ser desacoplado da infra de dados.

## 7. Validação pós-deploy

Depois do deploy, validar:

```bash
curl http://<api-host>:3001/health
curl http://<api-host>:3001/readiness
curl http://<api-host>:3001/metrics
```

Se houver proxy reverso, validar pela URL pública final da API.

---

## 8. Após o código

### Como rodar e validar

Validação local da imagem:

```bash
docker build -f apps/api/Dockerfile -t pulselane-api:local .
docker run --rm -p 3001:3001 --env-file infra/docker/api/.env.example pulselane-api:local
```

Validação local do container em ambiente real exige um `.env` com secrets e `DATABASE_URL` válido.

Validação da pipeline:

1. subir os arquivos
2. configurar os secrets no GitHub
3. criar `.env` no servidor em `DEPLOY_PATH`
4. fazer push em `main`
5. confirmar execução de:

   * `API CI`
   * `API Deploy`