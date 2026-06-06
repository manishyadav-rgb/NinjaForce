#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash deploy/ec2/backup_postgres.sh
#
# Creates timestamped dump in /var/backups/quirkyhome-postgres

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.production"

if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

: "${DATABASE_URL:?DATABASE_URL is required. Put it in .env.production}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/quirkyhome-postgres}"
mkdir -p "${BACKUP_DIR}"

STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/quirkyhome_${STAMP}.dump"

pg_dump "${DATABASE_URL}" -Fc -f "${FILE}"
echo "Backup created: ${FILE}"
