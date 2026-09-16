$ErrorActionPreference = "Stop"

Write-Host "[Work 06] Generating and validating Prisma client/schema..."
npm run db:generate
npm run db:validate

Write-Host "[Work 06] Applying migrations and idempotent seed..."
npm run db:migrate
npm run db:seed
npm run db:seed

Write-Host "[Work 06] Type/lint/test/build gates..."
npm run lint:web
npm run typecheck:web
npm run typecheck:providers
npm run typecheck:worker
npm run test:work6
npm run build:web
npm run check:offline

Write-Host "[Work 06] Technical gates passed."
Write-Host "Run npm run dev:web, then npm run qa:work6:api in another terminal."
Write-Host "Keep PROVIDER_ROUTING_ENABLED=false until a real TTC contract is verified."
