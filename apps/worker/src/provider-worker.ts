import { createHash } from "node:crypto";
import {
  OrderStatus,
  Prisma,
  ProviderHealth,
  ProviderJobStatus,
  ProviderJobType,
  ProviderMappingStatus,
  ProviderOrderStatus,
  ProviderServiceStatus,
  ProviderSubmissionState,
  ProviderStatus,
  WalletReservationStatus,
  getDb,
  type ProviderJob
} from "@tuong-tac-pro/db";
import {
  applyProviderServiceSync,
  captureOrderReservationInTransaction,
  enqueueProviderJob,
  markProviderOrderStatus,
  partialRefundTarget,
  releaseOrderReservationInTransaction,
  refundProviderOrderToTarget
} from "@tuong-tac-pro/domain";
import {
  ProviderAdapterError,
  calculateProviderCost,
  createDefaultProviderRegistry,
  decideProviderRetry,
  grossMargin,
  hasSafeMargin,
  sanitizeProviderErrorMessage,
  sanitizeProviderValue,
  toProviderAdapterError,
  type NormalizedProviderOrderStatus,
  type ProviderAdapter,
  type ProviderRegistry
} from "@tuong-tac-pro/providers";
import { completeProviderJob, failProviderJob, manualReviewProviderJob, providerJobClaimWhere, retryProviderJob } from "./queue";
import { withProviderRequestLease } from "./rate-limit";

const INITIAL_POLL_MS = Number(process.env.PROVIDER_POLL_INITIAL_MS || 60_000);
const MAX_POLL_MS = Number(process.env.PROVIDER_POLL_MAX_MS || 20 * 60_000);

const TERMINAL_INTERNAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  OrderStatus.COMPLETED,
  OrderStatus.REFUNDED,
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
  OrderStatus.PARTIAL
]);

const MANUAL_REVIEW_SUBMISSION_STATES: ReadonlySet<ProviderSubmissionState> = new Set<ProviderSubmissionState>([
  ProviderSubmissionState.UNKNOWN_SUBMISSION,
  ProviderSubmissionState.MANUAL_REVIEW
]);

const TERMINAL_PROVIDER_ORDER_STATUSES: ReadonlySet<ProviderOrderStatus> = new Set<ProviderOrderStatus>([
  ProviderOrderStatus.COMPLETED,
  ProviderOrderStatus.FAILED,
  ProviderOrderStatus.CANCELLED,
  ProviderOrderStatus.REFUNDED
]);

function statusPair(status: NormalizedProviderOrderStatus): { provider: ProviderOrderStatus; internal: OrderStatus } {
  switch (status) {
    case "COMPLETED": return { provider: ProviderOrderStatus.COMPLETED, internal: OrderStatus.COMPLETED };
    case "PARTIAL": return { provider: ProviderOrderStatus.PARTIAL, internal: OrderStatus.PARTIAL };
    case "FAILED": return { provider: ProviderOrderStatus.FAILED, internal: OrderStatus.FAILED };
    case "CANCELLED": return { provider: ProviderOrderStatus.CANCELLED, internal: OrderStatus.CANCELLED };
    case "REFUNDED": return { provider: ProviderOrderStatus.REFUNDED, internal: OrderStatus.REFUNDED };
    case "PROCESSING": return { provider: ProviderOrderStatus.PROCESSING, internal: OrderStatus.PROCESSING };
    case "SUBMITTED": return { provider: ProviderOrderStatus.SUBMITTED, internal: OrderStatus.SUBMITTED };
    case "PENDING": return { provider: ProviderOrderStatus.SUBMITTED, internal: OrderStatus.SUBMITTED };
    default: return { provider: ProviderOrderStatus.UNKNOWN, internal: OrderStatus.PROCESSING };
  }
}

function requestHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

async function operationLog(input: {
  providerId: string;
  orderId?: string;
  operation: string;
  externalOrderId?: string;
  startedAt: number;
  result: string;
  attempt?: number;
  errorCode?: string;
  metadata?: unknown;
}) {
  const db = getDb();
  await db.providerOperationLog.create({
    data: {
      providerId: input.providerId,
      orderId: input.orderId ?? null,
      operation: input.operation,
      externalOrderId: input.externalOrderId ?? null,
      durationMs: Math.max(0, Date.now() - input.startedAt),
      result: input.result,
      attempt: input.attempt ?? 1,
      errorCode: input.errorCode?.slice(0, 80) || null,
      metadata: sanitizeProviderValue(input.metadata) as object | undefined
    }
  });
}

async function markProviderHealth(providerId: string, health: ProviderHealth, errorCode?: string) {
  const db = getDb();
  await db.provider.update({
    where: { id: providerId },
    data: {
      health,
      lastHealthAt: new Date(),
      ...(health === ProviderHealth.HEALTHY ? { lastSuccessfulAt: new Date(), lastErrorCode: null } : { lastErrorCode: errorCode?.slice(0, 80) || null })
    }
  });
}

function adapterFor(registry: ProviderRegistry, code: string): ProviderAdapter {
  try {
    return registry.get(code);
  } catch (error) {
    throw new ProviderAdapterError("PROVIDER_CONFIGURATION_MISSING", error instanceof Error ? error.message : "Provider adapter missing.");
  }
}

async function handleTestConnection(job: ProviderJob, registry: ProviderRegistry) {
  if (!job.providerId) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Provider job missing providerId.");
  const db = getDb();
  const provider = await db.provider.findUniqueOrThrow({ where: { id: job.providerId } });
  const adapter = adapterFor(registry, provider.code);
  const startedAt = Date.now();
  const result = await withProviderRequestLease(provider.id, `job:${job.id}:test`, provider.timeoutMs, () => adapter.testConnection());
  await markProviderHealth(provider.id, result.ok ? ProviderHealth.HEALTHY : ProviderHealth.DEGRADED, result.ok ? undefined : "CONNECTION_FAILED");
  await operationLog({ providerId: provider.id, operation: "TEST_CONNECTION", startedAt, result: result.ok ? "SUCCESS" : "FAILED", metadata: { message: result.message ?? null } });
}

async function handleSyncServices(job: ProviderJob, registry: ProviderRegistry) {
  if (!job.providerId) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Provider job missing providerId.");
  const db = getDb();
  const provider = await db.provider.findUniqueOrThrow({ where: { id: job.providerId } });
  const adapter = adapterFor(registry, provider.code);
  if (!adapter.capabilities.supportsServiceSync) throw new ProviderAdapterError("PROVIDER_CONFIGURATION_MISSING", "Provider service sync capability is not verified.");
  const startedAt = Date.now();
  const services = await withProviderRequestLease(provider.id, `job:${job.id}:services`, provider.timeoutMs, () => adapter.getServices());
  const summary = await applyProviderServiceSync(provider.id, services);
  await markProviderHealth(provider.id, ProviderHealth.HEALTHY);
  await operationLog({ providerId: provider.id, operation: "SYNC_SERVICES", startedAt, result: "SUCCESS", metadata: summary });
}

async function handleSyncBalance(job: ProviderJob, registry: ProviderRegistry) {
  if (!job.providerId) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Provider job missing providerId.");
  const db = getDb();
  const provider = await db.provider.findUniqueOrThrow({ where: { id: job.providerId } });
  const adapter = adapterFor(registry, provider.code);
  if (!adapter.capabilities.supportsBalance) throw new ProviderAdapterError("PROVIDER_CONFIGURATION_MISSING", "Provider balance capability is not verified.");
  const startedAt = Date.now();
  const balance = await withProviderRequestLease(provider.id, `job:${job.id}:balance`, provider.timeoutMs, () => adapter.getBalance());
  await db.$transaction([
    db.provider.update({
      where: { id: provider.id },
      data: {
        balanceMinor: balance.amountMinor,
        balanceCurrency: balance.currency,
        lastBalanceSyncAt: new Date(),
        lastSuccessfulAt: new Date(),
        health: ProviderHealth.HEALTHY,
        lastErrorCode: null
      }
    }),
    db.providerBalanceSnapshot.create({ data: { providerId: provider.id, amountMinor: balance.amountMinor, currency: balance.currency } })
  ]);
  await operationLog({ providerId: provider.id, operation: "SYNC_BALANCE", startedAt, result: "SUCCESS", metadata: { currency: balance.currency, amountMinor: balance.amountMinor.toString() } });
}

async function schedulePoll(providerOrderId: string, providerId: string, orderId: string, delayMs: number) {
  const db = getDb();
  const runAt = new Date(Date.now() + delayMs);
  await db.$transaction(async (tx) => {
    await tx.providerOrder.update({ where: { id: providerOrderId }, data: { nextPollAt: runAt } });
    await enqueueProviderJob(tx, {
      type: ProviderJobType.POLL_ORDER_STATUS,
      dedupeKey: `poll:${providerOrderId}:${runAt.getTime()}`,
      providerId,
      orderId,
      providerOrderId,
      runAt
    });
  });
}

async function finalReleaseForSubmissionFailure(providerOrderId: string, code: string, message: string) {
  const db = getDb();
  const providerOrder = await db.providerOrder.findUniqueOrThrow({ where: { id: providerOrderId }, include: { order: true } });
  if (!await db.walletReservation.findUnique({ where: { orderId: providerOrder.orderId } })) {
    await refundProviderOrderToTarget({ orderId: providerOrder.orderId, targetRefundMinor: providerOrder.order.chargeMinor, finalStatus: OrderStatus.FAILED, remaining: providerOrder.order.quantity, reason: sanitizeProviderErrorMessage(message), providerOrderId, providerOrderStatus: ProviderOrderStatus.FAILED, providerSubmissionState: "REJECTED", providerErrorCode: code });
    return;
  }
  await db.$transaction(async (tx) => {
    const released = await releaseOrderReservationInTransaction(tx, providerOrder.orderId);
    await tx.providerOrder.update({
      where: { id: providerOrderId },
      data: {
        status: ProviderOrderStatus.FAILED,
        submissionState: ProviderSubmissionState.REJECTED,
        lastCheckedAt: new Date(),
        lastErrorCode: code,
        lastErrorMessage: sanitizeProviderErrorMessage(message)
      }
    });
    const order = await tx.order.update({
      where: { id: providerOrder.orderId },
      data: { status: OrderStatus.FAILED, remaining: providerOrder.order.quantity }
    });
    if (released.changed || providerOrder.order.status !== OrderStatus.FAILED) {
      await tx.orderLog.create({
        data: {
          orderId: order.id,
          fromStatus: providerOrder.order.status,
          toStatus: OrderStatus.FAILED,
          message: "Provider từ chối đơn; khoản giữ tiền đã được giải phóng.",
          metadata: { providerOrderId, providerErrorCode: code }
        }
      });
    }
  });
}

async function handleSubmitOrder(job: ProviderJob, registry: ProviderRegistry) {
  if (!job.orderId) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Submit job missing orderId.");
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: job.orderId }, include: { service: true, providerOrder: true } });
  if (!order) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Internal order no longer exists.");
  if (order.providerOrder?.submissionState === ProviderSubmissionState.ACCEPTED) return;
  if (order.providerOrder?.submissionState === ProviderSubmissionState.REJECTED) return;
  if (TERMINAL_INTERNAL_ORDER_STATUSES.has(order.status)) return;
  if (MANUAL_REVIEW_SUBMISSION_STATES.has(order.providerOrder?.submissionState ?? ProviderSubmissionState.PENDING)) {
    await manualReviewProviderJob(job, "UNKNOWN_SUBMISSION", "Order is already waiting for manual provider review.");
    return;
  }

  const mappingWhere = {
    serviceId: order.serviceId,
    ...(order.providerOrder ? { providerServiceId: order.providerOrder.providerServiceId } : {}),
    enabled: true,
    status: ProviderMappingStatus.ACTIVE,
    providerService: {
      status: ProviderServiceStatus.AVAILABLE,
      provider: { enabled: true, status: ProviderStatus.ACTIVE }
    }
  };
  const mapping = await db.serviceProviderMapping.findFirst({
    where: mappingWhere,
    orderBy: { priority: "asc" },
    include: { providerService: { include: { provider: true } } }
  });
  if (!mapping) throw new ProviderAdapterError("PROVIDER_SERVICE_UNAVAILABLE", "No active provider mapping is available for this service.");
  const providerService = mapping.providerService;
  const provider = providerService.provider;
  if (providerService.currency !== "VND") {
    throw new ProviderAdapterError("PROVIDER_CONFIGURATION_MISSING", "Foreign-currency provider pricing requires an explicit FX policy.");
  }
  if (order.quantity < providerService.min || order.quantity > providerService.max) {
    await db.serviceProviderMapping.update({ where: { id: mapping.id }, data: { status: ProviderMappingStatus.MIN_MAX_CONFLICT } });
    throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Order quantity conflicts with current provider limits.");
  }

  const providerCostMinor = calculateProviderCost(providerService.providerRateMinor, order.quantity, providerService.rateUnit);
  const marginMinor = grossMargin(order.chargeMinor, providerCostMinor);
  const clientReference = `ttp:${order.publicId}`;
  // Serialize admission by internal order, not only by queue job ID. Duplicate
  // jobs have different IDs, and stale claims must not blindly resend a create.
  const prepared = await db.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "orders" WHERE "id" = ${order.id}::uuid FOR UPDATE`);
    const current = await tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { providerOrder: true, reservation: true } });
    if (TERMINAL_INTERNAL_ORDER_STATUSES.has(current.status) || current.providerOrder?.submissionState === ProviderSubmissionState.ACCEPTED || current.providerOrder?.submissionState === ProviderSubmissionState.REJECTED) return null;
    if (current.reservation && current.reservation.status !== WalletReservationStatus.RESERVED) {
      throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Order funds are no longer reserved; submission is forbidden.");
    }
    if (!current.reservation) {
      const purchase = await tx.walletTransaction.findFirst({ where: { referenceType: "ORDER", referenceId: current.publicId, type: "PURCHASE", status: "COMPLETED", amountMinor: -current.chargeMinor, wallet: { userId: current.userId } } });
      if (!purchase) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Legacy order has no verified purchase ledger; submission is forbidden.");
    }
    if (current.providerOrder && ![ProviderSubmissionState.PENDING, ProviderSubmissionState.SAFE_TO_RETRY].some((state) => state === current.providerOrder!.submissionState)) {
      return { record: current.providerOrder, busy: true };
    }
    if (current.providerOrder && (current.providerOrder.providerServiceId !== providerService.id || current.providerOrder.providerId !== provider.id)) return { record: current.providerOrder, busy: true };
    const record = current.providerOrder ?? await tx.providerOrder.create({ data: {
      orderId: order.id,
      providerId: provider.id,
      providerServiceId: providerService.id,
      clientReference,
      providerRateSnapshotMinor: providerService.providerRateMinor,
      rateUnitSnapshot: providerService.rateUnit,
      providerCostMinor,
      customerChargeMinor: order.chargeMinor,
      grossMarginMinor: marginMinor,
      currency: providerService.currency,
      requestPayload: sanitizeProviderValue({ externalServiceId: providerService.externalServiceId, quantity: order.quantity, targetHash: createHash("sha256").update(order.targetUrl).digest("hex") }) as object
    } });
    const claimed = await tx.providerOrder.update({ where: { id: record.id }, data: { submissionState: ProviderSubmissionState.PREPARED } });
    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.VALIDATING } });
    return { record: claimed, busy: false };
  });
  if (!prepared) return;
  if (prepared.busy) {
    await manualReviewProviderJob(job, "SUBMISSION_IN_PROGRESS", "An existing submission is prepared, sending or awaiting review; reconcile it before resending.");
    return;
  }
  let providerOrder = prepared.record;

  if (!hasSafeMargin(order.chargeMinor, providerCostMinor, mapping.minimumMarginMinor)) {
    await db.$transaction([
      db.serviceProviderMapping.update({ where: { id: mapping.id }, data: { status: ProviderMappingStatus.PRICE_REVIEW_REQUIRED, lastPriceReviewAt: new Date() } }),
      db.providerOrder.update({ where: { id: providerOrder.id }, data: { submissionState: ProviderSubmissionState.MANUAL_REVIEW, lastErrorCode: "PRICE_REVIEW_REQUIRED", lastErrorMessage: "Provider cost violates minimum margin policy." } })
    ]);
    throw new ProviderAdapterError("PROVIDER_SERVICE_UNAVAILABLE", "Provider price requires admin review before submission.");
  }

  const adapter = adapterFor(registry, provider.code);
  const providerIdempotencyKey = adapter.capabilities.supportsCreateIdempotency ? `create:${order.publicId}` : undefined;
  const createInput = {
    internalOrderId: order.id,
    publicOrderId: order.publicId,
    externalServiceId: providerService.externalServiceId,
    target: order.targetUrl,
    quantity: order.quantity,
    idempotencyKey: providerIdempotencyKey,
    clientReference: adapter.capabilities.supportsClientReference ? clientReference : undefined
  };
  const attemptNo = providerOrder.attemptCount + 1;
  const attempt = await db.providerOrderAttempt.create({
    data: {
      orderId: order.id,
      providerOrderRecordId: providerOrder.id,
      providerId: provider.id,
      providerServiceId: providerService.id,
      attemptNo,
      providerIdempotencyKey,
      clientReference,
      requestHash: requestHash(createInput),
      state: ProviderSubmissionState.PREPARED
    }
  });
  providerOrder = await db.providerOrder.update({
    where: { id: providerOrder.id },
    data: { submissionState: ProviderSubmissionState.SENDING, attemptCount: attemptNo }
  });
  await db.order.update({ where: { id: order.id }, data: { status: OrderStatus.VALIDATING } });
  const startedAt = Date.now();
  let acceptedExternalId: string | undefined;
  let financialSettlementCommitted = false;

  try {
    const result = await withProviderRequestLease(provider.id, `job:${job.id}:create`, provider.timeoutMs, async () => {
      if (!await db.providerJob.findFirst({ where: providerJobClaimWhere(job), select: { id: true } })) {
        throw new ProviderAdapterError("PROVIDER_UNKNOWN_ERROR", "Submission claim was superseded; reconciliation is required.", { ambiguousSideEffect: true });
      }
      return adapter.createOrder(createInput);
    });
    if (result.outcome === "UNKNOWN") {
      await db.$transaction([
        db.providerOrderAttempt.update({ where: { id: attempt.id }, data: { state: ProviderSubmissionState.UNKNOWN_SUBMISSION, httpStatus: result.httpStatus ?? null, errorCode: result.code, finishedAt: new Date() } }),
        db.providerOrder.update({ where: { id: providerOrder.id }, data: { submissionState: ProviderSubmissionState.UNKNOWN_SUBMISSION, status: ProviderOrderStatus.UNKNOWN, lastErrorCode: result.code, lastErrorMessage: sanitizeProviderErrorMessage(result.message), responsePayload: sanitizeProviderValue(result.raw) as object | undefined } })
      ]);
      await operationLog({ providerId: provider.id, orderId: order.id, operation: "CREATE_ORDER", startedAt, result: "UNKNOWN", attempt: attemptNo, errorCode: result.code });
      await manualReviewProviderJob(job, "UNKNOWN_SUBMISSION", sanitizeProviderErrorMessage(result.message));
      return;
    }
    if (result.outcome === "REJECTED") {
      await db.providerOrderAttempt.update({ where: { id: attempt.id }, data: { state: ProviderSubmissionState.REJECTED, httpStatus: result.httpStatus ?? null, errorCode: result.code, finishedAt: new Date() } });
      if (result.retryable && job.attempts < job.maxAttempts && adapter.capabilities.supportsCreateIdempotency) {
        await db.providerOrder.update({ where: { id: providerOrder.id }, data: { submissionState: ProviderSubmissionState.SAFE_TO_RETRY, lastErrorCode: result.code, lastErrorMessage: sanitizeProviderErrorMessage(result.message) } });
        await retryProviderJob(job, result.code, result.message);
        return;
      }
      await finalReleaseForSubmissionFailure(providerOrder.id, result.code, result.message);
      financialSettlementCommitted = true;
      await operationLog({ providerId: provider.id, orderId: order.id, operation: "CREATE_ORDER", startedAt, result: "REJECTED", attempt: attemptNo, errorCode: result.code });
      return;
    }

    acceptedExternalId = result.externalOrderId;
    if (!acceptedExternalId?.trim()) throw new ProviderAdapterError("PROVIDER_MALFORMED_RESPONSE", "Accepted create did not include an external order ID.", { ambiguousSideEffect: true });
    // Create acceptance proves admission, not a complete refund decision. The
    // create contract has no remaining count; confirm partial/failure states
    // through polling so they cannot strand captured funds without a refund.
    const admittedStatus = result.status === "COMPLETED" || result.status === "PROCESSING" ? result.status : "SUBMITTED";
    const pair = statusPair(admittedStatus);
    const internalStatus = pair.internal;
    const remaining = internalStatus === OrderStatus.COMPLETED ? 0 : order.remaining;
    await db.$transaction(async (tx) => {
      await tx.providerOrderAttempt.update({
        where: { id: attempt.id },
        data: { state: ProviderSubmissionState.ACCEPTED, externalOrderId: result.externalOrderId, finishedAt: new Date() }
      });
      await tx.providerOrder.update({
        where: { id: providerOrder.id },
        data: {
          externalOrderId: result.externalOrderId,
          submissionState: ProviderSubmissionState.ACCEPTED,
          status: pair.provider,
          submittedAt: new Date(),
          responsePayload: sanitizeProviderValue(result.raw) as object | undefined,
          lastErrorCode: null,
          lastErrorMessage: null
        }
      });
      const reservation = await tx.walletReservation.findUnique({ where: { orderId: order.id } });
      if (reservation) await captureOrderReservationInTransaction(tx, order.id);
      else {
        // Work 04–06 orders were already debited. Never debit them again.
        const purchase = await tx.walletTransaction.findFirst({ where: { referenceType: "ORDER", referenceId: order.publicId, type: "PURCHASE", status: "COMPLETED", amountMinor: -order.chargeMinor, wallet: { userId: order.userId } } });
        if (!purchase) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Legacy order has neither a reservation nor a verified purchase ledger.", { ambiguousSideEffect: true });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: internalStatus, remaining } });
      await tx.orderLog.create({
        data: { orderId: order.id, fromStatus: OrderStatus.VALIDATING, toStatus: internalStatus, message: "Đơn đã được provider chấp nhận.", metadata: { providerOrderId: providerOrder.id } }
      });
      if (internalStatus !== OrderStatus.COMPLETED) {
        const runAt = new Date(Date.now() + INITIAL_POLL_MS);
        await tx.providerOrder.update({ where: { id: providerOrder.id }, data: { nextPollAt: runAt } });
        await enqueueProviderJob(tx, { type: ProviderJobType.POLL_ORDER_STATUS, dedupeKey: `initial-poll:${providerOrder.id}`, providerId: provider.id, orderId: order.id, providerOrderId: providerOrder.id, runAt });
      }
    });
    financialSettlementCommitted = true;
    await markProviderHealth(provider.id, ProviderHealth.HEALTHY);
    await operationLog({ providerId: provider.id, orderId: order.id, externalOrderId: result.externalOrderId, operation: "CREATE_ORDER", startedAt, result: "SUCCESS", attempt: attemptNo });
  } catch (error) {
    if (financialSettlementCommitted) {
      // Logging/health failures after commit must not rewrite accepted finance.
      await manualReviewProviderJob(job, "POST_SETTLEMENT_ERROR", "Provider financial settlement committed; ancillary operation failed. Do not resend create or change settled funds.");
      return;
    }
    const providerError = toProviderAdapterError(error, true);
    const decision = acceptedExternalId ? { action: "MANUAL_REVIEW" as const, code: "UNKNOWN_SUBMISSION" } : decideProviderRetry(providerError, job.attempts, job.maxAttempts, {
      sideEffecting: true,
      providerSupportsIdempotency: adapter.capabilities.supportsCreateIdempotency
    });
    await db.providerOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        state: decision.action === "MANUAL_REVIEW" ? ProviderSubmissionState.UNKNOWN_SUBMISSION : decision.action === "RETRY" ? ProviderSubmissionState.SAFE_TO_RETRY : ProviderSubmissionState.REJECTED,
        httpStatus: providerError.httpStatus ?? null,
        errorCode: providerError.code,
        finishedAt: new Date()
      }
    });
    await operationLog({ providerId: provider.id, orderId: order.id, operation: "CREATE_ORDER", startedAt, result: decision.action, attempt: attemptNo, errorCode: providerError.code });
    const safeMessage = sanitizeProviderErrorMessage(providerError.message);
    if (decision.action === "MANUAL_REVIEW" || (decision.action === "FAIL" && providerError.ambiguousSideEffect)) {
      await db.providerOrder.update({ where: { id: providerOrder.id }, data: { submissionState: ProviderSubmissionState.UNKNOWN_SUBMISSION, status: ProviderOrderStatus.UNKNOWN, ...(acceptedExternalId ? { externalOrderId: acceptedExternalId } : {}), lastErrorCode: providerError.code, lastErrorMessage: safeMessage } });
      await manualReviewProviderJob(job, "UNKNOWN_SUBMISSION", safeMessage);
      return;
    }
    if (decision.action === "RETRY") {
      await db.providerOrder.update({ where: { id: providerOrder.id }, data: { submissionState: ProviderSubmissionState.SAFE_TO_RETRY, lastErrorCode: providerError.code, lastErrorMessage: safeMessage } });
      await retryProviderJob(job, providerError.code, safeMessage, decision.delayMs);
      return;
    }
    await finalReleaseForSubmissionFailure(providerOrder.id, providerError.code, safeMessage);
  }
}

async function handlePoll(job: ProviderJob, registry: ProviderRegistry) {
  if (!job.providerOrderId) throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Poll job missing providerOrderId.");
  const db = getDb();
  const providerOrder = await db.providerOrder.findUnique({
    where: { id: job.providerOrderId },
    include: { provider: true, order: true }
  });
  if (!providerOrder || !providerOrder.externalOrderId) return;
  if (providerOrder.submissionState !== ProviderSubmissionState.ACCEPTED) {
    await manualReviewProviderJob(job, "UNKNOWN_SUBMISSION", "Polling cannot settle a create that has not been reconciled and captured.");
    return;
  }
  if (TERMINAL_PROVIDER_ORDER_STATUSES.has(providerOrder.status)) return;
  const adapter = adapterFor(registry, providerOrder.provider.code);
  const startedAt = Date.now();
  try {
    const result = await withProviderRequestLease(providerOrder.providerId, `job:${job.id}:status`, providerOrder.provider.timeoutMs, () => adapter.getOrderStatus({ externalOrderId: providerOrder.externalOrderId!, clientReference: providerOrder.clientReference }));
    const pair = statusPair(result.status);
    await operationLog({ providerId: providerOrder.providerId, orderId: providerOrder.orderId, externalOrderId: providerOrder.externalOrderId, operation: "GET_ORDER_STATUS", startedAt, result: "SUCCESS", attempt: job.attempts, metadata: { status: result.status, rawStatus: result.rawStatus ?? null } });

    if (result.status === "PARTIAL") {
      if (!Number.isInteger(result.remaining) || result.remaining === undefined || result.remaining < 0 || result.remaining > providerOrder.order.quantity) {
        await manualReviewProviderJob(job, "PROVIDER_MALFORMED_RESPONSE", "PARTIAL status requires a valid remaining count.");
        return;
      }
      const target = partialRefundTarget(providerOrder.order.chargeMinor, result.remaining, providerOrder.order.quantity);
      await refundProviderOrderToTarget({
        orderId: providerOrder.orderId,
        targetRefundMinor: target,
        finalStatus: OrderStatus.PARTIAL,
        remaining: result.remaining,
        reason: "Provider completed the order partially; proportional refund applied.",
        providerOrderId: providerOrder.id,
        providerOrderStatus: ProviderOrderStatus.PARTIAL,
        providerSubmissionState: "ACCEPTED"
      });
      return;
    }
    if (["FAILED", "CANCELLED", "REFUNDED"].includes(result.status)) {
      const terminalInternal = result.status === "CANCELLED" ? OrderStatus.CANCELLED : result.status === "REFUNDED" ? OrderStatus.REFUNDED : OrderStatus.FAILED;
      const terminalProvider = result.status === "CANCELLED" ? ProviderOrderStatus.CANCELLED : result.status === "REFUNDED" ? ProviderOrderStatus.REFUNDED : ProviderOrderStatus.FAILED;
      await refundProviderOrderToTarget({
        orderId: providerOrder.orderId,
        targetRefundMinor: providerOrder.order.chargeMinor,
        finalStatus: terminalInternal,
        remaining: result.remaining ?? providerOrder.order.quantity,
        reason: `Provider terminal status: ${result.status}.`,
        providerOrderId: providerOrder.id,
        providerOrderStatus: terminalProvider,
        providerSubmissionState: "ACCEPTED"
      });
      return;
    }
    if (result.status === "COMPLETED") {
      await markProviderOrderStatus({
        providerOrderId: providerOrder.id,
        providerStatus: pair.provider,
        internalStatus: OrderStatus.COMPLETED,
        remaining: 0,
        startCount: result.startCount,
        responsePayload: sanitizeProviderValue(result.raw) as object | undefined
      });
      return;
    }

    await markProviderOrderStatus({
      providerOrderId: providerOrder.id,
      providerStatus: pair.provider,
      internalStatus: pair.internal,
      remaining: result.remaining,
      startCount: result.startCount,
      responsePayload: sanitizeProviderValue(result.raw) as object | undefined
    });
    const ageMinutes = Math.max(0, (Date.now() - providerOrder.createdAt.getTime()) / 60_000);
    const delay = Math.min(MAX_POLL_MS, INITIAL_POLL_MS * Math.max(1, Math.ceil(ageMinutes / 30)));
    await schedulePoll(providerOrder.id, providerOrder.providerId, providerOrder.orderId, delay);
  } catch (error) {
    const providerError = toProviderAdapterError(error, false);
    await operationLog({ providerId: providerOrder.providerId, orderId: providerOrder.orderId, externalOrderId: providerOrder.externalOrderId, operation: "GET_ORDER_STATUS", startedAt, result: "ERROR", attempt: job.attempts, errorCode: providerError.code });
    if (providerError.retryable && job.attempts < job.maxAttempts) {
      await retryProviderJob(job, providerError.code, sanitizeProviderErrorMessage(providerError.message));
      return;
    }
    await manualReviewProviderJob(job, providerError.code, sanitizeProviderErrorMessage(providerError.message));
  }
}

export async function processProviderJob(job: ProviderJob, registry: ProviderRegistry = createDefaultProviderRegistry()): Promise<void> {
  if (job.status !== ProviderJobStatus.RUNNING) return;
  if (!await getDb().providerJob.findFirst({ where: providerJobClaimWhere(job), select: { id: true } })) return;
  try {
    switch (job.type) {
      case ProviderJobType.TEST_CONNECTION:
        await handleTestConnection(job, registry);
        break;
      case ProviderJobType.SYNC_SERVICES:
        await handleSyncServices(job, registry);
        break;
      case ProviderJobType.SYNC_BALANCE:
        await handleSyncBalance(job, registry);
        break;
      case ProviderJobType.SUBMIT_ORDER:
        await handleSubmitOrder(job, registry);
        break;
      case ProviderJobType.POLL_ORDER_STATUS:
        await handlePoll(job, registry);
        break;
      default:
        await failProviderJob(job, "UNSUPPORTED_JOB", `Unsupported provider job: ${String(job.type)}`);
        return;
    }
    const latest = await getDb().providerJob.findUnique({ where: { id: job.id } });
    if (latest?.status === ProviderJobStatus.RUNNING) await completeProviderJob(job);
  } catch (error) {
    const providerError = toProviderAdapterError(error, false);
    const message = sanitizeProviderErrorMessage(providerError.message);
    if (providerError.code === "PROVIDER_CONFIGURATION_MISSING" || providerError.code === "PROVIDER_UNAUTHORIZED" || providerError.code === "PROVIDER_INSUFFICIENT_BALANCE" || providerError.code === "PROVIDER_SERVICE_UNAVAILABLE" || providerError.code === "PROVIDER_INVALID_REQUEST") {
      await manualReviewProviderJob(job, providerError.code, message);
      if (job.providerId) await markProviderHealth(job.providerId, ProviderHealth.DEGRADED, providerError.code);
      return;
    }
    if (providerError.retryable && job.attempts < job.maxAttempts) {
      await retryProviderJob(job, providerError.code, message);
      return;
    }
    await failProviderJob(job, providerError.code, message);
  }
}
