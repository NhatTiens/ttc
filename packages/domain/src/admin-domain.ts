import {
  DepositStatus,
  OrderStatus,
  Prisma,
  ServiceStatus,
  SupportSenderType,
  SupportTicketStatus,
  UserRole,
  UserStatus,
  WalletTransactionStatus,
  WalletTransactionType,
  getDb
} from "@tuong-tac-pro/db";
import { DomainError } from "./errors";
import { createPublicId } from "./id";

export type AdminActor = { userId: string; ipAddress?: string | null };
export type AdminServiceInput = {
  code: string;
  name: string;
  description: string;
  platform: "FACEBOOK" | "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "THREADS";
  categoryId: string;
  ratePerThousandMinor: bigint;
  min: number;
  max: number;
  averageTime: string;
  popular: boolean;
  status: "ACTIVE" | "MAINTENANCE" | "DISABLED";
  priceChangeReason?: string;
};
export type AdminSettingsInput = {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  minimumDepositMinor: bigint;
  orderCreationEnabled: boolean;
  supportEnabled: boolean;
};

type JsonObject = Record<string, string | number | boolean | null>;

function errorCode(error: unknown) {
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
        timeout: 15000
      });
    } catch (error) {
      if (errorCode(error) === "P2034" && attempt < attempts) continue;
      throw error;
    }
  }
  throw new DomainError("INTERNAL_ERROR", "Không thể hoàn tất giao dịch quản trị.", 500);
}

async function audit(
  tx: Prisma.TransactionClient,
  actor: AdminActor,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    before?: JsonObject | null;
    after?: JsonObject | null;
    metadata?: JsonObject | null;
  }
) {
  await tx.adminAuditLog.create({
    data: {
      adminUserId: actor.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
      metadata: input.metadata ?? undefined,
      ipAddress: actor.ipAddress?.slice(0, 64) || null
    }
  });
}

function assertCustomer<T extends { role: UserRole }>(user: T | null): asserts user is T {
  if (!user || user.role !== UserRole.CUSTOMER) {
    throw new DomainError("VALIDATION_ERROR", "Không tìm thấy khách hàng hợp lệ.", 404);
  }
}

export async function changeCustomerStatus(actor: AdminActor, userId: string, status: "ACTIVE" | "SUSPENDED") {
  return serializable(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    assertCustomer(user);
    const next = status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    if (user.status === next) return user;
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        status: next,
        ...(next === UserStatus.SUSPENDED ? { sessionVersion: { increment: 1 } } : {})
      }
    });
    await audit(tx, actor, {
      action: next === UserStatus.SUSPENDED ? "USER_SUSPEND" : "USER_ACTIVATE",
      entityType: "USER",
      entityId: user.id,
      before: { status: user.status },
      after: { status: updated.status }
    });
    return updated;
  });
}

export async function adjustCustomerWallet(
  actor: AdminActor,
  userId: string,
  amountMinor: bigint,
  reason: string,
  idempotencyKey: string
) {
  if (amountMinor === 0n) throw new DomainError("VALIDATION_ERROR", "Số tiền điều chỉnh phải khác 0.", 400);
  return serializable(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    assertCustomer(user);
    if (!user.wallet) throw new DomainError("INTERNAL_ERROR", "Khách hàng chưa có ví.", 500);
    const key = `admin-adjust:${idempotencyKey}`;
    const existing = await tx.walletTransaction.findUnique({
      where: { walletId_idempotencyKey: { walletId: user.wallet.id, idempotencyKey: key } }
    });
    if (existing) {
      if (existing.amountMinor !== amountMinor || existing.reason !== reason.trim()) {
        throw new DomainError("DUPLICATE_REQUEST", "Idempotency-Key đã được dùng cho điều chỉnh khác.", 409);
      }
      return existing;
    }
    const nextBalance = user.wallet.balanceMinor + amountMinor;
    if (nextBalance < user.wallet.reservedMinor || nextBalance < 0n) {
      throw new DomainError("INSUFFICIENT_BALANCE", "Điều chỉnh này sẽ làm số dư khả dụng âm.", 409);
    }
    await tx.wallet.update({ where: { id: user.wallet.id }, data: { balanceMinor: nextBalance } });
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        type: WalletTransactionType.ADJUSTMENT,
        status: WalletTransactionStatus.COMPLETED,
        amountMinor,
        balanceBeforeMinor: user.wallet.balanceMinor,
        balanceAfterMinor: nextBalance,
        referenceType: "ADMIN_ADJUSTMENT",
        referenceId: user.id,
        description: `Điều chỉnh ví bởi quản trị viên: ${reason.trim()}`,
        idempotencyKey: key,
        adminUserId: actor.userId,
        reason: reason.trim()
      }
    });
    await audit(tx, actor, {
      action: "WALLET_ADJUSTMENT",
      entityType: "WALLET",
      entityId: user.wallet.id,
      before: { balanceMinor: user.wallet.balanceMinor.toString() },
      after: { balanceMinor: nextBalance.toString() },
      metadata: { amountMinor: amountMinor.toString(), reason: reason.trim(), customerUserId: user.id }
    });
    return transaction;
  });
}

export async function confirmDeposit(actor: AdminActor, publicId: string, reason: string) {
  return serializable(async (tx) => {
    const deposit = await tx.deposit.findUnique({ where: { publicId }, include: { user: { include: { wallet: true } } } });
    if (!deposit) throw new DomainError("DEPOSIT_NOT_FOUND", "Không tìm thấy yêu cầu nạp tiền.", 404);
    if (deposit.status === DepositStatus.CONFIRMED) return deposit;
    if (deposit.status !== DepositStatus.PENDING) {
      throw new DomainError("VALIDATION_ERROR", "Chỉ yêu cầu đang chờ mới có thể xác nhận.", 409);
    }
    const wallet = deposit.user.wallet;
    if (!wallet) throw new DomainError("INTERNAL_ERROR", "Khách hàng chưa có ví.", 500);
    const updatedCount = await tx.deposit.updateMany({
      where: { id: deposit.id, status: DepositStatus.PENDING },
      data: { status: DepositStatus.CONFIRMED, reference: deposit.reference ?? `ADMIN:${actor.userId}` }
    });
    if (updatedCount.count !== 1) throw new DomainError("DUPLICATE_REQUEST", "Yêu cầu nạp tiền đã được xử lý.", 409);
    const nextBalance = wallet.balanceMinor + deposit.amountMinor;
    await tx.wallet.update({ where: { id: wallet.id }, data: { balanceMinor: nextBalance } });
    const pendingLedger = await tx.walletTransaction.findFirst({
      where: { walletId: wallet.id, referenceType: "DEPOSIT", referenceId: deposit.publicId, type: WalletTransactionType.DEPOSIT },
      orderBy: { createdAt: "asc" }
    });
    if (pendingLedger) {
      await tx.walletTransaction.update({
        where: { id: pendingLedger.id },
        data: {
          status: WalletTransactionStatus.COMPLETED,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor: nextBalance,
          adminUserId: actor.userId,
          reason: reason.trim()
        }
      });
    } else {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEPOSIT,
          status: WalletTransactionStatus.COMPLETED,
          amountMinor: deposit.amountMinor,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor: nextBalance,
          referenceType: "DEPOSIT",
          referenceId: deposit.publicId,
          description: `Xác nhận nạp tiền ${deposit.publicId}`,
          idempotencyKey: `admin-confirm:${deposit.id}`,
          adminUserId: actor.userId,
          reason: reason.trim()
        }
      });
    }
    await audit(tx, actor, {
      action: "DEPOSIT_CONFIRM",
      entityType: "DEPOSIT",
      entityId: deposit.publicId,
      before: { status: deposit.status, walletBalanceMinor: wallet.balanceMinor.toString() },
      after: { status: DepositStatus.CONFIRMED, walletBalanceMinor: nextBalance.toString() },
      metadata: { amountMinor: deposit.amountMinor.toString(), reason: reason.trim() }
    });
    return tx.deposit.findUniqueOrThrow({ where: { id: deposit.id } });
  });
}

async function closePendingDeposit(actor: AdminActor, publicId: string, status: Extract<DepositStatus, "FAILED" | "CANCELLED">, reason: string) {
  return serializable(async (tx) => {
    const deposit = await tx.deposit.findUnique({ where: { publicId }, include: { user: { include: { wallet: true } } } });
    if (!deposit) throw new DomainError("DEPOSIT_NOT_FOUND", "Không tìm thấy yêu cầu nạp tiền.", 404);
    if (deposit.status !== DepositStatus.PENDING) throw new DomainError("VALIDATION_ERROR", "Chỉ yêu cầu đang chờ mới có thể thay đổi trạng thái này.", 409);
    await tx.deposit.update({ where: { id: deposit.id }, data: { status } });
    const wallet = deposit.user.wallet;
    if (wallet) {
      await tx.walletTransaction.updateMany({
        where: { walletId: wallet.id, referenceType: "DEPOSIT", referenceId: deposit.publicId, status: WalletTransactionStatus.PENDING },
        data: { status: WalletTransactionStatus.FAILED, adminUserId: actor.userId, reason: reason.trim() }
      });
    }
    await audit(tx, actor, {
      action: status === DepositStatus.FAILED ? "DEPOSIT_FAIL" : "DEPOSIT_CANCEL",
      entityType: "DEPOSIT",
      entityId: deposit.publicId,
      before: { status: deposit.status },
      after: { status },
      metadata: { reason: reason.trim() }
    });
    return tx.deposit.findUniqueOrThrow({ where: { id: deposit.id } });
  });
}

export function failDeposit(actor: AdminActor, publicId: string, reason: string) {
  return closePendingDeposit(actor, publicId, DepositStatus.FAILED, reason);
}

export function cancelDeposit(actor: AdminActor, publicId: string, reason: string) {
  return closePendingDeposit(actor, publicId, DepositStatus.CANCELLED, reason);
}

const refundableStatuses = new Set<OrderStatus>([
  OrderStatus.PENDING,
  OrderStatus.VALIDATING,
  OrderStatus.FAILED,
  OrderStatus.CANCELLED
]);

export async function refundOrder(actor: AdminActor, publicId: string, reason: string) {
  return serializable(async (tx) => {
    const order = await tx.order.findUnique({ where: { publicId }, include: { user: { include: { wallet: true } } } });
    if (!order) throw new DomainError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
    if (order.status === OrderStatus.REFUNDED) return order;
    if (!refundableStatuses.has(order.status)) {
      throw new DomainError("VALIDATION_ERROR", "Trạng thái đơn hiện tại chưa đủ điều kiện hoàn tiền tự động.", 409);
    }
    const wallet = order.user.wallet;
    if (!wallet) throw new DomainError("INTERNAL_ERROR", "Khách hàng chưa có ví.", 500);
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: OrderStatus.REFUNDED, remaining: 0 }
    });
    if (updated.count !== 1) throw new DomainError("DUPLICATE_REQUEST", "Đơn hàng đã được thay đổi bởi một thao tác khác.", 409);
    const nextBalance = wallet.balanceMinor + order.chargeMinor;
    await tx.wallet.update({ where: { id: wallet.id }, data: { balanceMinor: nextBalance } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTransactionType.REFUND,
        status: WalletTransactionStatus.COMPLETED,
        amountMinor: order.chargeMinor,
        balanceBeforeMinor: wallet.balanceMinor,
        balanceAfterMinor: nextBalance,
        referenceType: "ORDER",
        referenceId: order.publicId,
        description: `Hoàn tiền đơn ${order.publicId}`,
        idempotencyKey: `admin-refund:${order.id}`,
        adminUserId: actor.userId,
        reason: reason.trim()
      }
    });
    await tx.orderLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.REFUNDED,
        message: `Hoàn tiền bởi quản trị viên: ${reason.trim()}`,
        metadata: { adminUserId: actor.userId }
      }
    });
    await audit(tx, actor, {
      action: "ORDER_REFUND",
      entityType: "ORDER",
      entityId: order.publicId,
      before: { status: order.status, walletBalanceMinor: wallet.balanceMinor.toString() },
      after: { status: OrderStatus.REFUNDED, walletBalanceMinor: nextBalance.toString() },
      metadata: { amountMinor: order.chargeMinor.toString(), reason: reason.trim() }
    });
    return tx.order.findUniqueOrThrow({ where: { id: order.id } });
  });
}

function validateServiceInput(input: AdminServiceInput) {
  if (input.ratePerThousandMinor < 0n) throw new DomainError("VALIDATION_ERROR", "Giá dịch vụ không được âm.", 400);
  if (!Number.isSafeInteger(input.min) || !Number.isSafeInteger(input.max) || input.min <= 0 || input.max < input.min) {
    throw new DomainError("VALIDATION_ERROR", "Giới hạn số lượng dịch vụ không hợp lệ.", 400);
  }
}

export async function createService(actor: AdminActor, input: AdminServiceInput) {
  validateServiceInput(input);
  const db = getDb();
  try {
    return await db.$transaction(async (tx) => {
      const category = await tx.serviceCategory.findUnique({ where: { id: input.categoryId } });
      if (!category || !category.enabled) throw new DomainError("VALIDATION_ERROR", "Danh mục không khả dụng.", 400);
      const service = await tx.service.create({
        data: {
          id: createPublicId("SVC"),
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          description: input.description.trim(),
          platform: input.platform,
          categoryId: input.categoryId,
          ratePerThousandMinor: input.ratePerThousandMinor,
          min: input.min,
          max: input.max,
          averageTime: input.averageTime.trim(),
          popular: input.popular,
          status: input.status
        }
      });
      await audit(tx, actor, {
        action: "SERVICE_CREATE",
        entityType: "SERVICE",
        entityId: service.id,
        after: { code: service.code, status: service.status, ratePerThousandMinor: service.ratePerThousandMinor.toString() }
      });
      return service;
    });
  } catch (error) {
    if (error instanceof DomainError) throw error;
    if (errorCode(error) === "P2002") throw new DomainError("VALIDATION_ERROR", "Mã dịch vụ đã tồn tại.", 409);
    throw error;
  }
}

export async function updateService(actor: AdminActor, serviceId: string, input: AdminServiceInput) {
  validateServiceInput(input);
  const db = getDb();
  try {
    return await db.$transaction(async (tx) => {
      const current = await tx.service.findUnique({ where: { id: serviceId } });
      if (!current) throw new DomainError("SERVICE_NOT_FOUND", "Không tìm thấy dịch vụ.", 404);
      const category = await tx.serviceCategory.findUnique({ where: { id: input.categoryId } });
      if (!category || !category.enabled) throw new DomainError("VALIDATION_ERROR", "Danh mục không khả dụng.", 400);
      const updated = await tx.service.update({
        where: { id: serviceId },
        data: {
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          description: input.description.trim(),
          platform: input.platform,
          categoryId: input.categoryId,
          ratePerThousandMinor: input.ratePerThousandMinor,
          min: input.min,
          max: input.max,
          averageTime: input.averageTime.trim(),
          popular: input.popular,
          status: input.status
        }
      });
      await audit(tx, actor, {
        action: "SERVICE_UPDATE",
        entityType: "SERVICE",
        entityId: serviceId,
        before: { code: current.code, status: current.status, ratePerThousandMinor: current.ratePerThousandMinor.toString() },
        after: { code: updated.code, status: updated.status, ratePerThousandMinor: updated.ratePerThousandMinor.toString() }
      });
      if (current.status !== updated.status) {
        await audit(tx, actor, {
          action: "SERVICE_STATUS_CHANGE",
          entityType: "SERVICE",
          entityId: serviceId,
          before: { status: current.status },
          after: { status: updated.status }
        });
      }
      if (current.ratePerThousandMinor !== updated.ratePerThousandMinor) {
        await tx.servicePriceHistory.create({
          data: {
            serviceId,
            previousRateMinor: current.ratePerThousandMinor,
            newRateMinor: updated.ratePerThousandMinor,
            adminUserId: actor.userId,
            reason: input.priceChangeReason?.trim() || null
          }
        });
        await audit(tx, actor, {
          action: "SERVICE_PRICE_CHANGE",
          entityType: "SERVICE",
          entityId: serviceId,
          before: { ratePerThousandMinor: current.ratePerThousandMinor.toString() },
          after: { ratePerThousandMinor: updated.ratePerThousandMinor.toString() },
          metadata: { reason: input.priceChangeReason?.trim() || null }
        });
      }
      return updated;
    });
  } catch (error) {
    if (error instanceof DomainError) throw error;
    if (errorCode(error) === "P2002") throw new DomainError("VALIDATION_ERROR", "Mã dịch vụ đã tồn tại.", 409);
    throw error;
  }
}

export async function createCategory(actor: AdminActor, input: { id: string; name: string; sortOrder: number; enabled: boolean }) {
  const db = getDb();
  try {
    return await db.$transaction(async (tx) => {
      const category = await tx.serviceCategory.create({
        data: { id: input.id.trim().toLowerCase(), name: input.name.trim(), sortOrder: input.sortOrder, enabled: input.enabled }
      });
      await audit(tx, actor, { action: "CATEGORY_CREATE", entityType: "CATEGORY", entityId: category.id, after: { name: category.name, enabled: category.enabled } });
      return category;
    });
  } catch (error) {
    if (errorCode(error) === "P2002") throw new DomainError("VALIDATION_ERROR", "Mã danh mục đã tồn tại.", 409);
    throw error;
  }
}

export async function updateCategory(actor: AdminActor, categoryId: string, input: { name: string; sortOrder: number; enabled: boolean }) {
  const db = getDb();
  return db.$transaction(async (tx) => {
    const current = await tx.serviceCategory.findUnique({ where: { id: categoryId } });
    if (!current) throw new DomainError("VALIDATION_ERROR", "Không tìm thấy danh mục.", 404);
    if (!input.enabled) {
      const activeReferences = await tx.service.count({ where: { categoryId, status: { not: ServiceStatus.DISABLED } } });
      if (activeReferences > 0) throw new DomainError("VALIDATION_ERROR", "Không thể tắt danh mục khi còn dịch vụ chưa bị vô hiệu hóa.", 409);
    }
    const updated = await tx.serviceCategory.update({ where: { id: categoryId }, data: input });
    await audit(tx, actor, {
      action: "CATEGORY_UPDATE",
      entityType: "CATEGORY",
      entityId: categoryId,
      before: { name: current.name, enabled: current.enabled, sortOrder: current.sortOrder },
      after: { name: updated.name, enabled: updated.enabled, sortOrder: updated.sortOrder }
    });
    return updated;
  });
}

export async function sendAdminSupportReply(actor: AdminActor, ticketPublicId: string, body: string) {
  const db = getDb();
  return db.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({ where: { publicId: ticketPublicId } });
    if (!ticket) throw new DomainError("TICKET_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ.", 404);
    if (ticket.status === SupportTicketStatus.CLOSED) throw new DomainError("VALIDATION_ERROR", "Yêu cầu đã đóng.", 409);
    const message = await tx.supportMessage.create({
      data: { ticketId: ticket.id, senderType: SupportSenderType.ADMIN, senderUserId: actor.userId, body: body.trim() }
    });
    await tx.supportTicket.update({ where: { id: ticket.id }, data: { status: SupportTicketStatus.WAITING_CUSTOMER } });
    await audit(tx, actor, {
      action: "SUPPORT_REPLY",
      entityType: "SUPPORT_TICKET",
      entityId: ticket.publicId,
      before: { status: ticket.status },
      after: { status: SupportTicketStatus.WAITING_CUSTOMER }
    });
    return message;
  });
}

export async function updateSupportStatus(actor: AdminActor, ticketPublicId: string, status: SupportTicketStatus) {
  const db = getDb();
  return db.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({ where: { publicId: ticketPublicId } });
    if (!ticket) throw new DomainError("TICKET_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ.", 404);
    if (ticket.status === status) return ticket;
    const updated = await tx.supportTicket.update({ where: { id: ticket.id }, data: { status } });
    await audit(tx, actor, {
      action: "SUPPORT_STATUS_CHANGE",
      entityType: "SUPPORT_TICKET",
      entityId: ticket.publicId,
      before: { status: ticket.status },
      after: { status }
    });
    return updated;
  });
}

export async function updateSystemSettings(actor: AdminActor, input: AdminSettingsInput) {
  if (input.minimumDepositMinor < 0n) throw new DomainError("VALIDATION_ERROR", "Số tiền nạp tối thiểu không được âm.", 400);
  const db = getDb();
  return db.$transaction(async (tx) => {
    const current = await tx.systemSetting.findUnique({ where: { id: "default" } });
    const settingsData = {
      siteName: input.siteName,
      supportEmail: input.supportEmail,
      maintenanceMode: input.maintenanceMode,
      minimumDepositMinor: input.minimumDepositMinor,
      orderCreationEnabled: input.orderCreationEnabled,
      supportEnabled: input.supportEnabled,
      updatedByUserId: actor.userId
    };
    const updated = await tx.systemSetting.upsert({
      where: { id: "default" },
      update: settingsData,
      create: { id: "default", ...settingsData }
    });
    await audit(tx, actor, {
      action: "SYSTEM_SETTING_UPDATE",
      entityType: "SYSTEM_SETTING",
      entityId: "default",
      before: current ? {
        siteName: current.siteName,
        supportEmail: current.supportEmail,
        maintenanceMode: current.maintenanceMode,
        minimumDepositMinor: current.minimumDepositMinor.toString(),
        orderCreationEnabled: current.orderCreationEnabled,
        supportEnabled: current.supportEnabled
      } : null,
      after: {
        siteName: updated.siteName,
        supportEmail: updated.supportEmail,
        maintenanceMode: updated.maintenanceMode,
        minimumDepositMinor: updated.minimumDepositMinor.toString(),
        orderCreationEnabled: updated.orderCreationEnabled,
        supportEnabled: updated.supportEnabled
      }
    });
    return updated;
  });
}
