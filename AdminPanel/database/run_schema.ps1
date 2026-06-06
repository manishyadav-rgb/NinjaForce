$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.local"
$schemaFile = Join-Path $root "database/001_init_schema.sql"

if (-not (Test-Path $envFile)) {
  throw ".env.local not found at $envFile"
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw "psql is not installed or not in PATH. Use Supabase SQL Editor or install PostgreSQL client."
}

$lines = Get-Content $envFile | Where-Object { $_ -and -not $_.Trim().StartsWith("#") }
$dbLine = $lines | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1

if (-not $dbLine) {
  throw "DATABASE_URL not found in .env.local"
}

$dbUrl = $dbLine.Substring("DATABASE_URL=".Length).Trim()
if (-not $dbUrl) {
  throw "DATABASE_URL is empty in .env.local"
}

Write-Host "Applying schema using DATABASE_URL..."
psql $dbUrl -v ON_ERROR_STOP=1 -f $schemaFile
Write-Host "Schema applied successfully."
