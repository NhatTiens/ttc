$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot
if (!(Test-Path "package.json") -or !(Test-Path "packages/db/prisma/schema.prisma")) {
    throw "Run this verifier from a complete TTC repository."
}

$gates = @(
    "db:generate", "db:validate", "test:qa", "audit:production", "db:test:prepare",
    "test:backend", "test:providers", "test:worker", "lint:web",
    "typecheck:web", "typecheck:providers", "typecheck:worker",
    "check:offline", "qa:work7:static", "build:web"
)
foreach ($gate in $gates) {
    Write-Host "[Work 07] $gate"
    & npm run $gate
    if ($LASTEXITCODE -ne 0) { throw "Gate '$gate' failed with exit code $LASTEXITCODE. Work 07 is not PASS." }
}
Write-Host "WORK 07 technical gates passed. Live provider verification is a separate opt-in operation."
