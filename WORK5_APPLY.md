# Work 05 apply guide

Base checkpoint: `NhatTiens/ttc` main commit `025cf16db7d80f61d846db7af95d8390f2d0047b` (`Complete Work 04 backend and database integration`).

This hotfix contains only files added or changed by Work 05. No provider integration, Tương Tác Chéo call, or automatic payment gateway is included.

## Apply on Windows PowerShell

From the existing Work 04 project root:

```powershell
$zip = "$HOME\Downloads\tuong-tac-pro-work5-hotfix.zip"
$tmp = "$env:TEMP\ttc-work5-hotfix"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $tmp -Force
Copy-Item "$tmp\work5-hotfix\*" ".\" -Recurse -Force
```

The hotfix adds a Prisma migration. No new npm dependency was added, so an already working Work 04 `node_modules` normally does not need reinstalling.

## Database + technical gates

```powershell
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run db:seed
npm run test:backend
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
```

Then run the app:

```powershell
npm run dev:web
```

In a second PowerShell window:

```powershell
npm run qa:work5:api
```

Development admin seed defaults (development only; override via `.env`):

```text
admin@example.com
Admin1234
```

Before Work 05 acceptance, manually verify Admin and Customer flows plus browser console and responsive UI at 1440, 1280, 1024, 768, 430, 390 and 375 px as listed in `WORK5_QA_REPORT.md`.
