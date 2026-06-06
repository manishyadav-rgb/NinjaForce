#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash deploy/ec2/apply_schema.sh
#
# Reads values from .env.production if present.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.production"

if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

: "${DATABASE_URL:?DATABASE_URL is required. Put it in .env.production}"

echo "Applying schema from database/001_init_schema.sql ..."
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/database/001_init_schema.sql"
echo "Schema applied successfully."
