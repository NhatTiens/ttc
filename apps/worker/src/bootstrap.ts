import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Standalone workers do not get Next.js/Prisma env loading automatically.
// Load the repository-root .env before importing worker modules because
// queue/provider configuration is read at module evaluation time.
const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

await import("./index");
