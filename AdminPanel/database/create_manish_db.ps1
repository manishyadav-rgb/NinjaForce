$ErrorActionPreference = "Stop"

param(
  [string]$DbUser = "manish",
  [string]$DbPassword = "My8572839479#",
  [string]$DbName = "quirkyhome",
  [string]$PgSuperUser = "postgres",
  [string]$PgSuperPassword = "postgres@123",
  [string]$PgHost = "127.0.0.1",
  [int]$PgPort = 5432
)

$env:PGPASSWORD = $PgSuperPassword

Write-Host "Creating/Updating role '$DbUser'..."
psql -h $PgHost -p $PgPort -U $PgSuperUser -d postgres -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DbUser') THEN CREATE ROLE $DbUser LOGIN PASSWORD '$DbPassword'; ELSE ALTER ROLE $DbUser WITH PASSWORD '$DbPassword'; END IF; END \$\$;"

Write-Host "Creating database '$DbName' if not exists..."
$exists = psql -h $PgHost -p $PgPort -U $PgSuperUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName';"
if ($exists.Trim() -ne "1") {
  psql -h $PgHost -p $PgPort -U $PgSuperUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DbName OWNER $DbUser;"
}

Write-Host "Applying schema..."
psql -h $PgHost -p $PgPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f "database/001_init_schema.sql"

Write-Host "Done. Database '$DbName' with all tables is ready."
