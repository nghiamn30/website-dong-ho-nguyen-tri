param(
  [string]$BackendEnvPath = "backend/.env",
  [switch]$SkipPrisma
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "node was not found in PATH."
}

$nodeScript = Join-Path $PSScriptRoot "init-db.cjs"
$nodeArgs = @($nodeScript, "--env", $BackendEnvPath)

if ($SkipPrisma) {
  $nodeArgs += "--skip-prisma"
}

& node @nodeArgs
if ($LASTEXITCODE -ne 0) {
  throw "Database initialization failed."
}
