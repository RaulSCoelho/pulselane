#!/bin/sh
set -eu

DEPLOY_DIR="${1:?Deploy directory is required}"

COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

if [ -z "${API_IMAGE:-}" ]; then
  echo "API_IMAGE environment variable is required."
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Compose file not found at ${COMPOSE_FILE}."
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "Environment file not found at ${ENV_FILE}."
  exit 1
fi

export API_IMAGE

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull api
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d api --remove-orphans
docker image prune -f