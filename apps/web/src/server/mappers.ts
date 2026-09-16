import type {
  Deposit, DepositMethod, NotificationPreference, Order, OrderLog, Service, ServiceCategory, SupportMessage,
  SupportTicket, User, Wallet, WalletTransaction
} from "@tuong-tac-pro/db";
import { moneyToSafeNumber } from "@tuong-tac-pro/domain";

const platformMap = { FACEBOOK: "facebook", TIKTOK: "tiktok", INSTAGRAM: "instagram", YOUTUBE: "youtube", THREADS: "threads", GOOGLE: "google" } as const;
const serviceStatusMap = { ACTIVE: "Active", MAINTENANCE: "Maintenance", DISABLED: "Paused" } as const;
const orderStatusMap = {
  PENDING: "Pending", VALIDATING: "Processing", SUBMITTED: "Processing", PROCESSING: "Processing", COMPLETED: "Completed",
  PARTIAL: "Partial", FAILED: "Failed", CANCELLED: "Cancelled", REFUNDED: "Refunded"
} as const;
const transactionTypeMap = { DEPOSIT: "Deposit", PURCHASE: "Purchase", REFUND: "Refund", ADJUSTMENT: "Adjustment" } as const;
const transactionStatusMap = { PENDING: "Pending", COMPLETED: "Completed", FAILED: "Failed", REFUNDED: "Completed" } as const;
const ticketStatusMap = { OPEN: "Open", WAITING_CUSTOMER: "Waiting", WAITING_SUPPORT: "Waiting", RESOLVED: "Resolved", CLOSED: "Closed" } as const;
const depositStatusMap = { PENDING: "Pending", CONFIRMED: "Confirmed", FAILED: "Failed", CANCELLED: "Cancelled", REFUNDED: "Refunded" } as const;

export function toProfile(user: User, preference?: NotificationPreference | null) {
  return {
    id: user.id, name: user.name, email: user.email, phone: user.phone ?? "", joinedAt: user.createdAt.toISOString(),
    security: { twoFactorEnabled: user.twoFactorEnabled, lastPasswordChange: user.lastPasswordChangeAt.toISOString() },
    notifications: {
      orderUpdates: preference?.orderUpdates ?? true,
      walletUpdates: preference?.walletUpdates ?? true,
      promotions: preference?.promotions ?? false,
      supportReplies: preference?.supportReplies ?? true
    }
  };
}

export function toWallet(wallet: Wallet) {
  return { balance: moneyToSafeNumber(wallet.balanceMinor - wallet.reservedMinor), currency: "VND" as const };
}

export function toCategory(category: ServiceCategory) { return { id: category.id, name: category.name }; }
export function toService(service: Service) {
  return {
    id: service.id, code: service.code, platform: platformMap[service.platform], category: service.categoryId, name: service.name,
    description: service.description, ratePerThousand: moneyToSafeNumber(service.ratePerThousandMinor), min: service.min, max: service.max,
    status: serviceStatusMap[service.status], averageTime: service.averageTime, popular: service.popular
  };
}

type OrderWithService = Order & { service: Service; logs?: OrderLog[] };
export function toOrder(order: OrderWithService) {
  return {
    id: order.publicId, serviceId: order.serviceId, serviceName: order.service.name, platform: platformMap[order.service.platform], targetUrl: order.targetUrl,
    quantity: order.quantity, startCount: order.startCount ?? undefined, charge: moneyToSafeNumber(order.chargeMinor), remaining: order.remaining,
    status: orderStatusMap[order.status], createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(),
    timeline: order.logs?.map((log) => ({ status: orderStatusMap[log.toStatus], message: log.message, createdAt: log.createdAt.toISOString() }))
  };
}

export function toWalletTransaction(transaction: WalletTransaction) {
  return {
    id: transaction.id, type: transactionTypeMap[transaction.type], description: transaction.description, amount: moneyToSafeNumber(transaction.amountMinor),
    balanceAfter: moneyToSafeNumber(transaction.balanceAfterMinor), date: transaction.createdAt.toISOString(), status: transactionStatusMap[transaction.status],
    reference: transaction.referenceId ?? undefined
  };
}

export function toDepositMethod(method: DepositMethod) {
  const instructions = Array.isArray(method.instructions) ? method.instructions.filter((item): item is string => typeof item === "string") : [];
  return {
    id: method.id, name: method.name, type: method.type === "BANK" ? "bank" as const : method.type === "QR" ? "qr" as const : "manual" as const,
    description: method.description, min: moneyToSafeNumber(method.minMinor), max: moneyToSafeNumber(method.maxMinor), feeLabel: method.feeLabel,
    enabled: method.enabled, instructions
  };
}

export function toDeposit(deposit: Deposit) {
  return { id: deposit.publicId, methodId: deposit.methodId, amount: moneyToSafeNumber(deposit.amountMinor), status: depositStatusMap[deposit.status], createdAt: deposit.createdAt.toISOString() };
}

type TicketWithLast = SupportTicket & { messages?: SupportMessage[] };
export function toTicket(ticket: TicketWithLast) {
  const latest = ticket.messages?.at(-1);
  return {
    id: ticket.publicId, subject: ticket.subject, category: ticket.category, status: ticketStatusMap[ticket.status],
    createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString(), lastMessage: latest?.body ?? ""
  };
}

type SupportMessageWithSender = SupportMessage & { senderUser?: { name: string } | null };
export function toSupportMessage(message: SupportMessageWithSender, ticketPublicId: string) {
  const customer = message.senderType === "CUSTOMER";
  return {
    id: message.id, ticketId: ticketPublicId, sender: customer ? "customer" as const : "admin" as const,
    senderName: customer ? (message.senderUser?.name ?? "Khách hàng") : (message.senderUser?.name ?? "Hỗ trợ Tương Tác Pro"),
    body: message.body, createdAt: message.createdAt.toISOString()
  };
}
