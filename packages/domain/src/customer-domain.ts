import { createHash } from "node:crypto";
import {
  DepositStatus,
  OrderStatus,
  Prisma,
  ProviderMappingStatus,
  ProviderServiceStatus,
  ProviderStatus,
  ServiceStatus,
  SupportSenderType,
  SupportTicketStatus,
  UserRole,
  UserStatus,
  WalletTransactionStatus,
  WalletTransactionType,
  getDb
} from "@tuong-tac-pro/db";
import { DomainError, isTransactionConflict } from "./errors";
import { createPublicId } from "./id";
import { calculateChargeMinor } from "./money";
import { enqueueOrderSubmissionIfEnabled } from "./provider-domain";

export type QuoteCreateInput = { serviceId: string; quantity: number };
export type OrderCreateInput = { quoteId: string; targetUrl: string };
export type TicketCreateInput = { subject: string; category: string; message: string };
export type NotificationInput = { orderUpdates: boolean; walletUpdates: boolean; promotions: boolean; supportReplies: boolean };

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
}

function fingerprintOrder(input: OrderCreateInput) {
  return createHash("sha256")
    .update(JSON.stringify({ quoteId: input.quoteId, targetUrl: input.targetUrl.trim() }))
    .digest("hex");
}

async function serializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, attempts = 3): Promise<T> {
  const db = getDb();
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000
      });
    } catch (error) {
      if (isTransactionConflict(error) && attempt < attempts) continue;
      throw error;
    }
  }
  throw new DomainError("INTERNAL_ERROR", "Không thể hoàn tất giao dịch.", 500);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerCustomer(input: { email: string; passwordHash: string; name: string; phone?: string }) {
  const db = getDb();
  const email = normalizeEmail(input.email);
  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: input.passwordHash,
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          wallet: { create: { currency: "VND", balanceMinor: 0n, reservedMinor: 0n } },
          notificationPreference: {
            create: { orderUpdates: true, walletUpdates: true, promotions: false, supportReplies: true }
          }
        },
        include: { wallet: true, notificationPreference: true }
      });
      return user;
    });
  } catch (error) {
    if (errorCode(error) === "P2002") throw new DomainError("EMAIL_IN_USE", "Email này đã được sử dụng.", 409);
    throw error;
  }
}

export async function updateCustomerProfile(userId: string, input: { name: string; email: string; phone: string }) {
  const db = getDb();
  try {
    return await db.user.update({
      where: { id: userId },
      data: { name: input.name.trim(), email: normalizeEmail(input.email), phone: input.phone.trim() || null },
      include: { notificationPreference: true }
    });
  } catch (error) {
    if (errorCode(error) === "P2002") throw new DomainError("EMAIL_IN_USE", "Email này đã được sử dụng.", 409);
    throw error;
  }
}

export async function updateCustomerPassword(userId: string, passwordHash: string) {
  const db = getDb();
  return db.user.update({
    where: { id: userId },
    data: { passwordHash, lastPasswordChangeAt: new Date(), sessionVersion: { increment: 1 } }
  });
}

export async function updateNotificationPreferences(userId: string, input: NotificationInput) {
  const db = getDb();
  await db.notificationPreference.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input }
  });
  return db.user.findUniqueOrThrow({ where: { id: userId }, include: { notificationPreference: true } });
}

async function assertProviderRoute(tx: Prisma.TransactionClient, serviceId: string) {
  if (process.env.PROVIDER_ROUTING_ENABLED !== "true") return;
  const mapping = await tx.serviceProviderMapping.findFirst({
    where: {
      serviceId,
      enabled: true,
      status: ProviderMappingStatus.ACTIVE,
      providerService: {
        status: ProviderServiceStatus.AVAILABLE,
        provider: { enabled: true, status: ProviderStatus.ACTIVE }
      }
    },
    orderBy: { priority: "asc" },
    select: { id: true }
  });
  if (!mapping) throw new DomainError("SERVICE_UNAVAILABLE", "Dịch vụ chưa có tuyến nhà cung cấp khả dụng.", 409);
}

function quoteTtlMs() {
  const configured = Number(process.env.ORDER_QUOTE_TTL_SECONDS ?? 300);
  const seconds = Number.isFinite(configured) ? Math.max(30, Math.min(Math.trunc(configured), 3600)) : 300;
  return seconds * 1000;
}

export async function createOrderQuote(userId: string, input: QuoteCreateInput) {
  return serializable(async (tx) => {
    const settings = await tx.systemSetting.findUnique({ where: { id: "default" } });
    if (settings && !settings.orderCreationEnabled) {
      throw new DomainError("SERVICE_UNAVAILABLE", "Hệ thống đang tạm ngừng nhận đơn mới.", 409);
    }
    const service = await tx.service.findUnique({ where: { id: input.serviceId } });
    if (!service) throw new DomainError("SERVICE_NOT_FOUND", "Không tìm thấy dịch vụ.", 404);
    if (service.status !== ServiceStatus.ACTIVE) throw new DomainError("SERVICE_UNAVAILABLE", "Dịch vụ hiện không nhận đơn mới.", 409);
    if (!Number.isSafeInteger(input.quantity) || input.quantity < service.min || input.quantity > service.max) {
      throw new DomainError("VALIDATION_ERROR", `Số lượng phải từ ${service.min} đến ${service.max}.`, 400);
    }
    await assertProviderRoute(tx, service.id);
    const chargeMinor = calculateChargeMinor(service.ratePerThousandMinor, input.quantity);
    return tx.orderQuote.create({
      data: {
        userId,
        serviceId: service.id,
        quantity: input.quantity,
        ratePerThousandMinor: service.ratePerThousandMinor,
        chargeMinor,
        currency: "VND",
        expiresAt: new Date(Date.now() + quoteTtlMs())
      },
      include: { service: true }
    });
  });
}

export async function createCustomerOrder(userId: string, input: OrderCreateInput, idempotencyKey: string) {
  const requestFingerprint = fingerprintOrder(input);
  const db = getDb();
  try {
    return await serializable(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { service: true, logs: { orderBy: { createdAt: "asc" } } }
      });
      if (existing) {
        if (existing.requestFingerprint !== requestFingerprint) {
          throw new DomainError("DUPLICATE_REQUEST", "Idempotency-Key đã được dùng cho một yêu cầu khác.", 409);
        }
        return existing;
      }
      const settings = await tx.systemSetting.findUnique({ where: { id: "default" } });
      if (settings && !settings.orderCreationEnabled) {
        throw new DomainError("SERVICE_UNAVAILABLE", "Hệ thống đang tạm ngừng nhận đơn mới.", 409);
      }

      const quote = await tx.orderQuote.findFirst({
        where: { id: input.quoteId, userId },
        include: { service: true }
      });
      if (!quote) throw new DomainError("QUOTE_NOT_FOUND", "Không tìm thấy báo giá hợp lệ.", 404);
      if (quote.consumedAt) throw new DomainError("QUOTE_ALREADY_USED", "Báo giá này đã được sử dụng.", 409);
      const now = new Date();
      if (quote.expiresAt <= now) throw new DomainError("QUOTE_EXPIRED", "Báo giá đã hết hạn. Vui lòng tạo báo giá mới.", 409);
      if (quote.service.status !== ServiceStatus.ACTIVE) throw new DomainError("SERVICE_UNAVAILABLE", "Dịch vụ hiện không nhận đơn mới.", 409);
      await assertProviderRoute(tx, quote.serviceId);

      const consumed = await tx.orderQuote.updateMany({
        where: { id: quote.id, userId, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now }
      });
      if (consumed.count !== 1) throw new DomainError("QUOTE_ALREADY_USED", "Báo giá đã được sử dụng hoặc hết hạn.", 409);

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new DomainError("INTERNAL_ERROR", "Không tìm thấy ví khách hàng.", 500);
      const reserved = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "wallets"
        SET "reserved_minor" = "reserved_minor" + ${quote.chargeMinor},
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${wallet.id}::uuid
          AND ("balance_minor" - "reserved_minor") >= ${quote.chargeMinor}
        RETURNING "id"
      `);
      if (reserved.length !== 1) throw new DomainError("INSUFFICIENT_BALANCE", "Số dư khả dụng không đủ.", 409);

      const order = await tx.order.create({
        data: {
          publicId: createPublicId("TT"),
          userId,
          serviceId: quote.serviceId,
          targetUrl: input.targetUrl.trim(),
          quantity: quote.quantity,
          chargeMinor: quote.chargeMinor,
          remaining: quote.quantity,
          status: OrderStatus.PENDING,
          idempotencyKey,
          requestFingerprint,
          quoteId: quote.id
        }
      });
      await tx.walletReservation.create({
        data: {
          walletId: wallet.id,
          orderId: order.id,
          amountMinor: quote.chargeMinor
        }
      });
      await tx.orderLog.create({
        data: {
          orderId: order.id,
          toStatus: OrderStatus.PENDING,
          message: process.env.PROVIDER_ROUTING_ENABLED === "true"
            ? "Đơn hàng đã được tạo, tiền đã được giữ chỗ và đang chờ gửi tới nhà cung cấp."
            : "Đơn hàng đã được tạo và tiền đã được giữ chỗ; provider routing hiện chưa được bật."
        }
      });
      await enqueueOrderSubmissionIfEnabled(tx, order.id, order.publicId);
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { service: true, logs: { orderBy: { createdAt: "asc" } } }
      });
    });
  } catch (error) {
    if (error instanceof DomainError && error.code === "QUOTE_ALREADY_USED") {
      const replay = await db.order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { service: true, logs: { orderBy: { createdAt: "asc" } } }
      });
      if (replay) {
        if (replay.requestFingerprint !== requestFingerprint) {
          throw new DomainError("DUPLICATE_REQUEST", "Idempotency-Key đã được dùng cho một yêu cầu khác.", 409);
        }
        return replay;
      }
    }
    if (error instanceof DomainError) throw error;
    if (errorCode(error) === "P2002") {
      const existing = await db.order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { service: true, logs: { orderBy: { createdAt: "asc" } } }
      });
      if (existing) {
        if (existing.requestFingerprint !== requestFingerprint) {
          throw new DomainError("DUPLICATE_REQUEST", "Idempotency-Key đã được dùng cho một yêu cầu khác.", 409);
        }
        return existing;
      }
      const quoteOrder = await db.order.findFirst({
        where: { userId, quoteId: input.quoteId },
        include: { service: true, logs: { orderBy: { createdAt: "asc" } } }
      });
      if (quoteOrder) throw new DomainError("QUOTE_ALREADY_USED", "Báo giá này đã được sử dụng.", 409);
    }
    throw error;
  }
}

export async function createDepositRequest(userId: string, input: { methodId: string; amountMinor: bigint }, idempotencyKey: string) {
  const db = getDb();
  try {
    return await serializable(async (tx) => {
      const existing = await tx.deposit.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } });
      if (existing) {
        if (existing.methodId !== input.methodId || existing.amountMinor !== input.amountMinor) {
          throw new DomainError("DUPLICATE_REQUEST", "Idempotency-Key đã được dùng cho một yêu cầu nạp tiền khác.", 409);
        }
        return existing;
      }
      const settings = await tx.systemSetting.findUnique({ where: { id: "default" } });
      if (settings && input.amountMinor < settings.minimumDepositMinor) {
        throw new DomainError("VALIDATION_ERROR", `Số tiền nạp tối thiểu là ${settings.minimumDepositMinor.toString()} VND.`, 400);
      }
      const method = await tx.depositMethod.findUnique({ where: { id: input.methodId } });
      if (!method || !method.enabled) throw new DomainError("VALIDATION_ERROR", "Phương thức nạp tiền hiện không khả dụng.", 400);
      if (input.amountMinor < method.minMinor || input.amountMinor > method.maxMinor) {
        throw new DomainError("VALIDATION_ERROR", "Số tiền nạp nằm ngoài giới hạn của phương thức.", 400);
      }
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new DomainError("INTERNAL_ERROR", "Không tìm thấy ví khách hàng.", 500);
      const deposit = await tx.deposit.create({
        data: {
          publicId: createPublicId("DEP"), userId, methodId: input.methodId, amountMinor: input.amountMinor,
          status: DepositStatus.PENDING, idempotencyKey
        }
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEPOSIT,
          status: WalletTransactionStatus.PENDING,
          amountMinor: input.amountMinor,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor: wallet.balanceMinor,
          referenceType: "DEPOSIT",
          referenceId: deposit.publicId,
          description: `Yêu cầu nạp tiền ${deposit.publicId}`,
          idempotencyKey: `deposit:${idempotencyKey}`
        }
      });
      return deposit;
    });
  } catch (error) {
    if (error instanceof DomainError) throw error;
    if (errorCode(error) === "P2002") {
      const existing = await db.deposit.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } });
      if (existing) {
        if (existing.methodId !== input.methodId || existing.amountMinor !== input.amountMinor) {
          throw new DomainError("DUPLICATE_REQUEST", "Idempotency-Key đã được dùng cho một yêu cầu nạp tiền khác.", 409);
        }
        return existing;
      }
    }
    throw error;
  }
}

export async function createSupportTicket(userId: string, input: TicketCreateInput) {
  const db = getDb();
  return db.$transaction(async (tx) => {
    const settings = await tx.systemSetting.findUnique({ where: { id: "default" } });
    if (settings && !settings.supportEnabled) throw new DomainError("SERVICE_UNAVAILABLE", "Hỗ trợ đang tạm ngừng nhận yêu cầu mới.", 409);
    const ticket = await tx.supportTicket.create({
      data: {
        publicId: createPublicId("SUP"), userId, subject: input.subject.trim(), category: input.category.trim(),
        status: SupportTicketStatus.OPEN
      }
    });
    await tx.supportMessage.create({
      data: { ticketId: ticket.id, senderType: SupportSenderType.CUSTOMER, senderUserId: userId, body: input.message.trim() }
    });
    return ticket;
  });
}

export async function sendSupportReply(userId: string, ticketPublicId: string, body: string) {
  const db = getDb();
  return db.$transaction(async (tx) => {
    const settings = await tx.systemSetting.findUnique({ where: { id: "default" } });
    if (settings && !settings.supportEnabled) throw new DomainError("SERVICE_UNAVAILABLE", "Hỗ trợ đang tạm ngừng nhận phản hồi.", 409);
    const ticket = await tx.supportTicket.findFirst({ where: { publicId: ticketPublicId, userId } });
    if (!ticket) throw new DomainError("TICKET_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ.", 404);
    const message = await tx.supportMessage.create({
      data: { ticketId: ticket.id, senderType: SupportSenderType.CUSTOMER, senderUserId: userId, body: body.trim() }
    });
    await tx.supportTicket.update({ where: { id: ticket.id }, data: { status: SupportTicketStatus.WAITING_SUPPORT } });
    return message;
  });
}

export async function getOwnedOrder(userId: string, publicId: string) {
  const db = getDb();
  const order = await db.order.findFirst({
    where: { publicId, userId },
    include: { service: true, logs: { orderBy: { createdAt: "asc" } } }
  });
  if (!order) throw new DomainError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
  return order;
}

export async function getOwnedTicket(userId: string, publicId: string) {
  const db = getDb();
  const ticket = await db.supportTicket.findFirst({
    where: { publicId, userId },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { senderUser: { select: { name: true } } } } }
  });
  if (!ticket) throw new DomainError("TICKET_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ.", 404);
  return ticket;
}
