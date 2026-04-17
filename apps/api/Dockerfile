FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --dir apps/api db:generate
RUN pnpm --dir apps/api build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

RUN addgroup -S pulselane \
  && adduser -S pulselane -G pulselane

COPY --from=build /app /app

RUN chmod +x /app/apps/api/docker-entrypoint.sh \
  && chown -R pulselane:pulselane /app

USER pulselane

CMD ["sh", "/app/apps/api/docker-entrypoint.sh"]