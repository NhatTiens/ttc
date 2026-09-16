import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".env")) process.loadEnvFile(".env");

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error("TEST_DATABASE_URL is required. Copy .env.example to .env or export the variable before running backend tests.");
  process.exit(1);
}

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(command, ["--workspace", "@tuong-tac-pro/db", "run", "db:migrate"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testUrl }
});
process.exit(result.status ?? 1);
