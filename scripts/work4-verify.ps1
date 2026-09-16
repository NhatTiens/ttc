$ErrorActionPreference = "Stop"

Write-Host "[Work 04] Prisma validate" -ForegroundColor Cyan
npm run db:validate

Write-Host "[Work 04] Apply migrations" -ForegroundColor Cyan
npm run db:migrate

Write-Host "[Work 04] Idempotent seed" -ForegroundColor Cyan
npm run db:seed
npm run db:seed

Write-Host "[Work 04] Backend integration tests" -ForegroundColor Cyan
npm run test:backend

Write-Host "[Work 04] Lint" -ForegroundColor Cyan
npm run lint:web

Write-Host "[Work 04] TypeScript" -ForegroundColor Cyan
npm run typecheck:web

Write-Host "[Work 04] Production build" -ForegroundColor Cyan
npm run build:web

Write-Host "[Work 04] Offline contracts" -ForegroundColor Cyan
npm run check:offline

Write-Host "WORK 04 technical gate passed. Run dev:web + qa:work4:api and the restart persistence check before acceptance." -ForegroundColor Green
