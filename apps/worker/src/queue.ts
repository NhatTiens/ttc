import { ProviderJobStatus, getDb, type ProviderJob } from "@tuong-tac-pro/db";
import { computeBackoffMs } from "@tuong-tac-pro/providers";

const LOCK_TIMEOUT_MS = Number(process.env.PROVIDER_JOB_LOCK_TIMEOUT_MS || 5 * 60_000);

export async function claimDueProviderJobs(workerId: string, batchSize = Number(process.env.PROVIDER_JOB_BATCH_SIZE || 10)): Promise<ProviderJob[]> {
  const db = getDb();
  const now = new Date();
  const stale = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  const candidates = await db.providerJob.findMany({
    where: {
      OR: [
        { status: { in: [ProviderJobStatus.PENDING, ProviderJobStatus.RETRY] }, runAt: { lte: now } },
        { status: ProviderJobStatus.RUNNING, lockedAt: { lt: stale } }
      ]
    },
    orderBy: [{ runAt: "asc" }, { createdAt: "asc" }],
    take: Math.max(1, Math.min(batchSize, 100))
  });
  const claimed: ProviderJob[] = [];
  for (const candidate of candidates) {
    const result = await db.providerJob.updateMany({
      where: {
        id: candidate.id,
        OR: [
          { status: { in: [ProviderJobStatus.PENDING, ProviderJobStatus.RETRY] }, runAt: { lte: now } },
          { status: ProviderJobStatus.RUNNING, lockedAt: { lt: stale } }
        ]
      },
      data: {
        status: ProviderJobStatus.RUNNING,
        lockedAt: now,
        lockedBy: workerId,
        attempts: { increment: 1 }
      }
    });
    if (result.count === 1) claimed.push(await db.providerJob.findUniqueOrThrow({ where: { id: candidate.id } }));
  }
  return claimed;
}

export async function completeProviderJob(jobId: string): Promise<void> {
  const db = getDb();
  await db.providerJob.update({
    where: { id: jobId },
    data: { status: ProviderJobStatus.COMPLETED, completedAt: new Date(), lockedAt: null, lockedBy: null, lastErrorCode: null, lastErrorMessage: null }
  });
}

export async function manualReviewProviderJob(jobId: string, code: string, message: string): Promise<void> {
  const db = getDb();
  await db.providerJob.update({
    where: { id: jobId },
    data: {
      status: ProviderJobStatus.MANUAL_REVIEW,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: code.slice(0, 80),
      lastErrorMessage: message.slice(0, 500)
    }
  });
}

export async function failProviderJob(jobId: string, code: string, message: string): Promise<void> {
  const db = getDb();
  await db.providerJob.update({
    where: { id: jobId },
    data: {
      status: ProviderJobStatus.FAILED,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: code.slice(0, 80),
      lastErrorMessage: message.slice(0, 500)
    }
  });
}

export async function retryProviderJob(job: ProviderJob, code: string, message: string, delayMs?: number): Promise<void> {
  const db = getDb();
  if (job.attempts >= job.maxAttempts) {
    return failProviderJob(job.id, "MAX_ATTEMPTS", message);
  }
  const waitMs = delayMs ?? computeBackoffMs(job.attempts);
  await db.providerJob.update({
    where: { id: job.id },
    data: {
      status: ProviderJobStatus.RETRY,
      runAt: new Date(Date.now() + waitMs),
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: code.slice(0, 80),
      lastErrorMessage: message.slice(0, 500)
    }
  });
}
