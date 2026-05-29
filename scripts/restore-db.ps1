param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$BackendEnvPath = "backend/.env",
  [switch]$Force
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

if (-not (Test-Path -LiteralPath $BackupFile)) {
  throw "Không tìm thấy file backup: $BackupFile"
}

Import-DotEnv -Path $BackendEnvPath

if ($env:DB_ENABLED -ne "true") {
  throw "DB_ENABLED chưa bật. Restore chỉ áp dụng khi dùng PostgreSQL local."
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  throw "Không tìm thấy pg_restore trong PATH. Cài PostgreSQL client trước khi restore."
}

$databaseName = if ($env:DB_NAME) { $env:DB_NAME } else { "dong_ho_nguyen_tri" }

if (-not $Force) {
  $answer = Read-Host "Restore sẽ ghi đè object trùng trong database '$databaseName'. Nhập RESTORE để tiếp tục"
  if ($answer -ne "RESTORE") {
    throw "Đã hủy restore."
  }
}

if ($env:DB_PASSWORD) {
  $env:PGPASSWORD = $env:DB_PASSWORD
}

if ($env:DATABASE_URL) {
  pg_restore --clean --if-exists --no-owner --dbname $env:DATABASE_URL $BackupFile
} else {
  $hostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
  $port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
  $user = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

  pg_restore --clean --if-exists --no-owner --host $hostName --port $port --username $user --dbname $databaseName $BackupFile
}

Write-Host "Restore database hoàn tất từ: $BackupFile"
