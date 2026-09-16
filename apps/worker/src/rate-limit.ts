import { Prisma, getDb } from "@tuong-tac-pro/db";
import { ProviderAdapterError } from "@tuong-tac-pro/providers";

function errorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

async function serializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, attempts = 4): Promise<T> {
  const db = getDb();
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000
      });
    } catch (error) {
      if (errorCode(error) === "P2034" && attempt < attempts) continue;
      throw error;
    }
  }
  throw new ProviderAdapterError("PROVIDER_RATE_LIMIT", "Unable to acquire provider outbound lease.", { retryable: true });
}

export async function withProviderRequestLease<T>(
  providerId: string,
  workerId: string,
  providerTimeoutMs: number,
  operation: () => Promise<T>
): Promise<T> {
  const now = new Date();
  const leaseMs = Math.max(30_000, providerTimeoutMs * 2);
  const lease = await serializable(async (tx) => {
    await tx.providerRequestLease.deleteMany({ where: { providerId, expiresAt: { lte: now } } });
    const provider = await tx.provider.findUniqueOrThrow({ where: { id: providerId } });
    const active = await tx.providerRequestLease.count({ where: { providerId, expiresAt: { gt: now } } });
    if (active >= provider.maxConcurrentRequests || (provider.nextRequestAt && provider.nextRequestAt > now)) return null;
    const created = await tx.providerRequestLease.create({
      data: { providerId, workerId: workerId.slice(0, 120), expiresAt: new Date(now.getTime() + leaseMs) }
    });
    await tx.provider.update({
      where: { id: providerId },
      data: { nextRequestAt: new Date(now.getTime() + provider.minRequestIntervalMs) }
    });
    return created;
  });

  if (!lease) {
    throw new ProviderAdapterError("PROVIDER_RATE_LIMIT", "Provider outbound concurrency/rate limit is busy.", { retryable: true });
  }

  try {
    return await operation();
  } finally {
    await getDb().providerRequestLease.deleteMany({ where: { id: lease.id } }).catch(() => undefined);
  }
}
