$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
function Invoke-NpmGate {
    param([string]$Gate)
    & npm run $Gate
    if ($LASTEXITCODE -ne 0) { throw "Gate '$Gate' failed with exit code $LASTEXITCODE." }
}

Write-Host "[Work 06] Generating and validating Prisma client/schema..."
Invoke-NpmGate "db:generate"
Invoke-NpmGate "db:validate"

Write-Host "[Work 06] Applying migrations and idempotent seed..."
Invoke-NpmGate "db:migrate"
Invoke-NpmGate "db:seed"
Invoke-NpmGate "db:seed"

Write-Host "[Work 06] Type/lint/test/build gates..."
Invoke-NpmGate "lint:web"
Invoke-NpmGate "typecheck:web"
Invoke-NpmGate "typecheck:providers"
Invoke-NpmGate "typecheck:worker"
Invoke-NpmGate "test:work6"
Invoke-NpmGate "build:web"
Invoke-NpmGate "check:offline"

Write-Host "[Work 06] Technical gates passed."
Write-Host "Run npm run dev:web, then npm run qa:work6:api in another terminal."
Write-Host "Keep PROVIDER_ROUTING_ENABLED=false until a real TTC contract is verified."
