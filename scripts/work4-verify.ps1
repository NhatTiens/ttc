$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
function Invoke-NpmGate {
    param([string]$Gate)
    & npm run $Gate
    if ($LASTEXITCODE -ne 0) { throw "Gate '$Gate' failed with exit code $LASTEXITCODE." }
}

Write-Host "[Work 04] Prisma validate" -ForegroundColor Cyan
Invoke-NpmGate "db:validate"

Write-Host "[Work 04] Apply migrations" -ForegroundColor Cyan
Invoke-NpmGate "db:migrate"

Write-Host "[Work 04] Idempotent seed" -ForegroundColor Cyan
Invoke-NpmGate "db:seed"
Invoke-NpmGate "db:seed"

Write-Host "[Work 04] Backend integration tests" -ForegroundColor Cyan
Invoke-NpmGate "test:backend"

Write-Host "[Work 04] Lint" -ForegroundColor Cyan
Invoke-NpmGate "lint:web"

Write-Host "[Work 04] TypeScript" -ForegroundColor Cyan
Invoke-NpmGate "typecheck:web"

Write-Host "[Work 04] Production build" -ForegroundColor Cyan
Invoke-NpmGate "build:web"

Write-Host "[Work 04] Offline contracts" -ForegroundColor Cyan
Invoke-NpmGate "check:offline"

Write-Host "WORK 04 technical gate passed. Run dev:web + qa:work4:api and the restart persistence check before acceptance." -ForegroundColor Green
