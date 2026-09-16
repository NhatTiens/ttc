import { randomUUID } from "node:crypto";
import { disconnectDb } from "@tuong-tac-pro/db";
import { createDefaultProviderRegistry } from "@tuong-tac-pro/providers";
import { claimDueProviderJobs } from "./queue";
import { processProviderJob } from "./provider-worker";

const workerId = process.env.PROVIDER_WORKER_ID || `provider-worker-${randomUUID().slice(0, 8)}`;
const pollMs = Math.max(250, Number(process.env.PROVIDER_WORKER_POLL_MS || 1000));
const once = process.argv.includes("--once") || process.env.PROVIDER_WORKER_ONCE === "true";
const registry = createDefaultProviderRegistry();

async function runBatch(): Promise<number> {
  const jobs = await claimDueProviderJobs(workerId);
  for (const job of jobs) await processProviderJob(job, registry);
  return jobs.length;
}

async function main() {
  if (once) {
    const count = await runBatch();
    console.log(`[provider-worker] once processed ${count} job(s).`);
    await disconnectDb();
    return;
  }
  console.log(`[provider-worker] started ${workerId}`);
  for (;;) {
    const count = await runBatch();
    if (count === 0) await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

process.on("SIGINT", async () => {
  await disconnectDb();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnectDb();
  process.exit(0);
});

main().catch(async (error) => {
  console.error("[provider-worker] fatal", error instanceof Error ? error.message : error);
  await disconnectDb();
  process.exitCode = 1;
});
