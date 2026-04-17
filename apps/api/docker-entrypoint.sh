#!/bin/sh
set -eu

cd /app/apps/api

echo "Running Prisma migrations..."
pnpm prisma migrate deploy

echo "Starting Pulselane API..."
exec node dist/src/main.js