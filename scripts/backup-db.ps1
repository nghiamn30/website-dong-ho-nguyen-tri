param(
  [string]$BackendEnvPath = "backend/.env",
  [string]$OutputDir = ".backups"
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $parts = $line.Split("=", 2)
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
  }
}

Import-DotEnv -Path $BackendEnvPath

if ($env:DB_ENABLED -ne "true") {
  throw "DB_ENABLED chưa bật. Backup chỉ áp dụng khi dùng PostgreSQL local."
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "Không tìm thấy pg_dump trong PATH. Cài PostgreSQL client trước khi backup."
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$databaseName = if ($env:DB_NAME) { $env:DB_NAME } else { "dong_ho_nguyen_tri" }
$outputFile = Join-Path $OutputDir "$databaseName-$timestamp.dump"

if ($env:DB_PASSWORD) {
  $env:PGPASSWORD = $env:DB_PASSWORD
}

if ($env:DATABASE_URL) {
  pg_dump --format=custom --no-owner --file $outputFile $env:DATABASE_URL
} else {
  $hostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
  $port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
  $user = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

  pg_dump --format=custom --no-owner --host $hostName --port $port --username $user --dbname $databaseName --file $outputFile
}

Write-Host "Backup database đã tạo: $outputFile"
