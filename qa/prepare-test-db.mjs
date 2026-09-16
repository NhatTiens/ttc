import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".env")) process.loadEnvFile(".env");

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error("TEST_DATABASE_URL is required. Copy .env.example to .env or export the variable before running backend tests.");
  process.exit(1);
}

const isWindows = process.platform === "win32";
const command = isWindows ? (process.env.ComSpec || "cmd.exe") : "npm";
const args = isWindows
  ? ["/d", "/s", "/c", "npm --workspace @tuong-tac-pro/db run db:migrate"]
  : ["--workspace", "@tuong-tac-pro/db", "run", "db:migrate"];

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testUrl }
});

if (result.error) {
  console.error("Failed to prepare TEST_DATABASE_URL:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
