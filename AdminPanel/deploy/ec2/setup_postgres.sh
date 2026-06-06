#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   sudo bash deploy/ec2/setup_postgres.sh
#
# Optional env overrides:
#   APP_DB_NAME=quirkyhome
#   APP_DB_USER=quirkyhome_user
#   APP_DB_PASSWORD='strong-password'

APP_DB_NAME="${APP_DB_NAME:-quirkyhome}"
APP_DB_USER="${APP_DB_USER:-quirkyhome_user}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-change-me-strong-password}"
PG_VERSION="${PG_VERSION:-16}"

echo "[1/6] Installing PostgreSQL ${PG_VERSION}..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y postgresql postgresql-contrib

echo "[2/6] Enabling and starting PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

echo "[3/6] Creating DB role and database..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_DB_USER}') THEN
    CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}';
  ELSE
    ALTER ROLE ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${APP_DB_USER}" "${APP_DB_NAME}"
fi

echo "[4/6] Securing auth to scram-sha-256 for local connections..."
PG_HBA_FILE="$(sudo -u postgres psql -tAc "SHOW hba_file" | tr -d ' ')"
if ! grep -q "local   all             ${APP_DB_USER}                                scram-sha-256" "${PG_HBA_FILE}"; then
  echo "local   all             ${APP_DB_USER}                                scram-sha-256" >> "${PG_HBA_FILE}"
fi

echo "[5/6] Applying PostgreSQL config baseline..."
PG_CONF_FILE="$(sudo -u postgres psql -tAc "SHOW config_file" | tr -d ' ')"
if ! grep -q "password_encryption = scram-sha-256" "${PG_CONF_FILE}"; then
  echo "password_encryption = scram-sha-256" >> "${PG_CONF_FILE}"
fi

systemctl restart postgresql

echo "[6/6] Done."
echo "Database: ${APP_DB_NAME}"
echo "User: ${APP_DB_USER}"
echo "Next: run deploy/ec2/apply_schema.sh to create tables."
