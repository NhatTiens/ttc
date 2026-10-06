import {
  Prisma,
  WalletReservationStatus,
  WalletTransactionStatus,
  WalletTransactionType,
  getDb
} from "@tuong-tac-pro/db";
import { DomainError, isTransactionConflict } from "./errors";

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
  throw new DomainError("INTERNAL_ERROR", "Không thể hoàn tất giao dịch ví.", 500);
}

export async function captureOrderReservationInTransaction(tx: Prisma.TransactionClient, orderId: string) {
  const reservation = await tx.walletReservation.findUnique({
    where: { orderId },
    include: { order: true }
  });
  if (!reservation) throw new DomainError("INTERNAL_ERROR", "Không tìm thấy khoản giữ tiền của đơn hàng.", 500);
  if (reservation.status === WalletReservationStatus.CAPTURED) return { reservation, changed: false };
  if (reservation.status === WalletReservationStatus.RELEASED) {
    throw new DomainError("RESERVATION_CONFLICT", "Khoản giữ tiền đã được giải phóng nên không thể capture.", 409);
  }
  const wallets = await tx.$queryRaw<Array<{ balanceMinor: bigint; reservedMinor: bigint }>>(Prisma.sql`
    SELECT "balance_minor" AS "balanceMinor", "reserved_minor" AS "reservedMinor"
    FROM "wallets"
    WHERE "id" = ${reservation.walletId}::uuid
    FOR UPDATE
  `);
  const wallet = wallets[0];
  if (!wallet) throw new DomainError("INTERNAL_ERROR", "Không tìm thấy ví của khoản giữ tiền.", 500);

  const transitioned = await tx.walletReservation.updateMany({
    where: { id: reservation.id, status: WalletReservationStatus.RESERVED },
    data: { status: WalletReservationStatus.CAPTURED, capturedAt: new Date() }
  });
  if (transitioned.count !== 1) {
    const latest = await tx.walletReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    if (latest.status === WalletReservationStatus.CAPTURED) return { reservation: latest, changed: false };
    throw new DomainError("RESERVATION_CONFLICT", "Khoản giữ tiền đã được xử lý đồng thời.", 409);
  }

  const walletUpdated = await tx.wallet.updateMany({
    where: {
      id: reservation.walletId,
      balanceMinor: { gte: reservation.amountMinor },
      reservedMinor: { gte: reservation.amountMinor }
    },
    data: {
      balanceMinor: { decrement: reservation.amountMinor },
      reservedMinor: { decrement: reservation.amountMinor }
    }
  });
  if (walletUpdated.count !== 1) {
    throw new DomainError("INTERNAL_ERROR", "Số dư giữ chỗ của ví không nhất quán.", 500);
  }

  const balanceAfter = wallet.balanceMinor - reservation.amountMinor;
  await tx.walletTransaction.create({
    data: {
      walletId: reservation.walletId,
      type: WalletTransactionType.PURCHASE,
      status: WalletTransactionStatus.COMPLETED,
      amountMinor: -reservation.amountMinor,
      balanceBeforeMinor: wallet.balanceMinor,
      balanceAfterMinor: balanceAfter,
      referenceType: "ORDER",
      referenceId: reservation.order.publicId,
      description: `Đơn hàng ${reservation.order.publicId}`,
      idempotencyKey: `reservation-capture:${reservation.orderId}`
    }
  });

  return {
    reservation: await tx.walletReservation.findUniqueOrThrow({ where: { id: reservation.id } }),
    changed: true
  };
}

export async function releaseOrderReservationInTransaction(tx: Prisma.TransactionClient, orderId: string) {
  const reservation = await tx.walletReservation.findUnique({ where: { orderId } });
  if (!reservation) throw new DomainError("INTERNAL_ERROR", "Không tìm thấy khoản giữ tiền của đơn hàng.", 500);
  if (reservation.status === WalletReservationStatus.RELEASED) return { reservation, changed: false };
  if (reservation.status === WalletReservationStatus.CAPTURED) {
    throw new DomainError("RESERVATION_CONFLICT", "Khoản giữ tiền đã được capture nên không thể release.", 409);
  }
  const wallets = await tx.$queryRaw<Array<{ reservedMinor: bigint }>>(Prisma.sql`
    SELECT "reserved_minor" AS "reservedMinor"
    FROM "wallets"
    WHERE "id" = ${reservation.walletId}::uuid
    FOR UPDATE
  `);
  if (!wallets[0]) throw new DomainError("INTERNAL_ERROR", "Không tìm thấy ví của khoản giữ tiền.", 500);

  const transitioned = await tx.walletReservation.updateMany({
    where: { id: reservation.id, status: WalletReservationStatus.RESERVED },
    data: { status: WalletReservationStatus.RELEASED, releasedAt: new Date() }
  });
  if (transitioned.count !== 1) {
    const latest = await tx.walletReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    if (latest.status === WalletReservationStatus.RELEASED) return { reservation: latest, changed: false };
    throw new DomainError("RESERVATION_CONFLICT", "Khoản giữ tiền đã được xử lý đồng thời.", 409);
  }

  const walletUpdated = await tx.wallet.updateMany({
    where: { id: reservation.walletId, reservedMinor: { gte: reservation.amountMinor } },
    data: { reservedMinor: { decrement: reservation.amountMinor } }
  });
  if (walletUpdated.count !== 1) {
    throw new DomainError("INTERNAL_ERROR", "Số dư giữ chỗ của ví không nhất quán.", 500);
  }

  return {
    reservation: await tx.walletReservation.findUniqueOrThrow({ where: { id: reservation.id } }),
    changed: true
  };
}

export function captureOrderReservation(orderId: string) {
  return serializable((tx) => captureOrderReservationInTransaction(tx, orderId));
}

export function releaseOrderReservation(orderId: string) {
  return serializable((tx) => releaseOrderReservationInTransaction(tx, orderId));
}
