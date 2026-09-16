export type AdminPage<T> = { items: T[]; page: number; pageSize: number; total: number; pageCount: number };
export type AdminUserStatus = "ACTIVE" | "SUSPENDED";
export type AdminOrderStatus = "PENDING" | "VALIDATING" | "SUBMITTED" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "REFUNDED";
export type AdminServiceStatus = "ACTIVE" | "MAINTENANCE" | "DISABLED";
export type AdminPlatform = "FACEBOOK" | "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "THREADS" | "GOOGLE";
export type AdminDepositStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "REFUNDED";
export type AdminSupportStatus = "OPEN" | "WAITING_CUSTOMER" | "WAITING_SUPPORT" | "RESOLVED" | "CLOSED";

export type AdminDashboard = {
  metrics: {
    customers: number;
    activeUsers: number;
    suspendedUsers: number;
    ordersToday: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    failedOrders: number;
    totalCustomerSpend: number;
    confirmedDepositVolume: number;
    pendingDeposits: number;
    walletLiability: number;
    openSupportTickets: number;
  };
  analytics: AdminAnalytics;
};

export type AdminUserListItem = {
  id: string; name: string; email: string; phone: string; status: AdminUserStatus; walletBalance: number; orderCount: number;
  joinedAt: string; updatedAt: string; lastActivity: string;
};
export type AdminUserDetail = AdminUserListItem & {
  role: string;
  walletId: string | null;
  reservedBalance: number;
  transactions: AdminTransaction[];
  orders: AdminOrder[];
  deposits: AdminDeposit[];
  tickets: AdminSupportTicket[];
};
export type AdminWallet = { id: string; userId: string; customerName: string; email: string; balance: number; reserved: number; currency: string; updatedAt: string };
export type AdminTransaction = {
  id: string; customerName: string; customerEmail: string; type: string; status: string; amount: number; balanceBefore: number; balanceAfter: number;
  referenceType: string; referenceId: string; description: string; adminName: string; reason: string; createdAt: string;
};
export type AdminOrder = {
  id: string; customerId: string; customerName: string; customerEmail: string; serviceId: string; serviceName: string; serviceCode: string;
  platform: AdminPlatform; targetUrl: string; quantity: number; charge: number; startCount: number | null; remaining: number; status: AdminOrderStatus;
  createdAt: string; updatedAt: string;
};
export type AdminOrderDetail = AdminOrder & {
  timeline: { fromStatus: AdminOrderStatus | null; toStatus: AdminOrderStatus; message: string; createdAt: string }[];
  walletTransactions: AdminTransaction[];
  provider: AdminProviderEconomics | null;
};
export type AdminCategory = { id: string; name: string; sortOrder: number; enabled: boolean; serviceCount: number; createdAt: string; updatedAt: string };
export type AdminService = {
  id: string; code: string; name: string; description: string; platform: AdminPlatform; categoryId: string; categoryName: string;
  ratePerThousand: number; min: number; max: number; averageTime: string; status: AdminServiceStatus; popular: boolean; orderCount: number;
  createdAt: string; updatedAt: string;
};
export type AdminServiceDetail = AdminService & { priceHistory: { previousRate: number; newRate: number; adminName: string; reason: string; createdAt: string }[] };
export type AdminDeposit = {
  id: string; customerId: string; customerName: string; customerEmail: string; methodId: string; methodName: string; amount: number; status: AdminDepositStatus;
  reference: string; createdAt: string; updatedAt: string;
};
export type AdminSupportTicket = {
  id: string; customerId: string; customerName: string; customerEmail: string; subject: string; category: string; status: AdminSupportStatus;
  createdAt: string; updatedAt: string; lastMessage: string;
};
export type AdminSupportThread = {
  ticket: AdminSupportTicket;
  messages: { id: string; senderType: "CUSTOMER" | "ADMIN"; senderName: string; body: string; createdAt: string }[];
};
export type AdminAnalytics = {
  rangeDays: number;
  daily: { date: string; orders: number; customerSpend: number; newCustomers: number; deposits: number; refunds: number }[];
  platformDistribution: { label: string; count: number }[];
  topServices: { id: string; name: string; orders: number; customerSpend: number }[];
  orderStatusDistribution: { status: string; count: number }[];
  walletLiability: number;
  providerEconomics: { orderCount: number; customerCharge: number; providerCost: number; grossMargin: number; byProvider: { provider: string; orders: number; providerCost: number; grossMargin: number }[] };
};
export type AdminAuditLog = {
  id: string; timestamp: string; adminId: string; adminName: string; action: string; entityType: string; entityId: string;
  before: unknown; after: unknown; metadata: unknown; ipAddress: string;
};
export type AdminSettings = {
  siteName: string; supportEmail: string; maintenanceMode: boolean; minimumDeposit: number; orderCreationEnabled: boolean; supportEnabled: boolean; updatedAt: string;
};

export type AdminServiceInput = {
  code: string; name: string; description: string; platform: AdminPlatform; categoryId: string; ratePerThousand: number; min: number; max: number;
  averageTime: string; popular: boolean; status: AdminServiceStatus; priceChangeReason?: string;
};
export type AdminCategoryInput = { id?: string; name: string; sortOrder: number; enabled: boolean };

export type AdminProviderStatus = "ACTIVE" | "DISABLED" | "DEGRADED";
export type AdminProviderHealth = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";
export type AdminProvider = {
  id: string;
  code: string;
  name: string;
  status: AdminProviderStatus;
  health: AdminProviderHealth;
  enabled: boolean;
  priority: number;
  baseUrlConfigured: boolean;
  credentialConfigured: boolean;
  balance: number | null;
  balanceCurrency: string;
  lastBalanceSyncAt: string | null;
  lastHealthAt: string | null;
  lastSuccessfulAt: string | null;
  lastErrorCode: string;
  services: number;
  mappedServices: number;
  unmappedServices: number;
  errors: number;
  updatedAt: string;
};
export type AdminProviderService = {
  id: string;
  externalServiceId: string;
  name: string;
  category: string;
  platform: AdminPlatform | null;
  providerRate: number;
  rateUnit: number;
  currency: string;
  min: number;
  max: number;
  supportsRefill: boolean;
  supportsCancel: boolean;
  status: "AVAILABLE" | "UNAVAILABLE" | "DISABLED" | "REMOVED";
  lastSyncedAt: string;
  mappings: {
    id: string;
    internalServiceId: string;
    internalServiceCode: string;
    internalServiceName: string;
    customerRate: number;
    marginPerRateUnit: number;
    enabled: boolean;
    priority: number;
    markupType: "PERCENTAGE" | "FIXED";
    markupBps: number;
    fixedMarkup: number;
    minimumMargin: number;
    pricingMode: "MANUAL" | "AUTO_MARKUP";
    status: "ACTIVE" | "DISABLED" | "PRICE_REVIEW_REQUIRED" | "PROVIDER_UNAVAILABLE" | "MIN_MAX_CONFLICT";
  }[];
};
export type AdminProviderJob = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAt: string;
  lastErrorCode: string;
  lastErrorMessage: string;
  createdAt: string;
};
export type AdminProviderOperation = {
  id: string;
  operation: string;
  result: string;
  durationMs: number | null;
  attempt: number;
  errorCode: string;
  createdAt: string;
};
export type AdminProviderDetail = AdminProvider & {
  servicesList: AdminProviderService[];
  jobs: AdminProviderJob[];
  operations: AdminProviderOperation[];
};
export type AdminProviderMappingInput = {
  serviceId: string;
  providerServiceId: string;
  enabled: boolean;
  priority: number;
  markupType: "PERCENTAGE" | "FIXED";
  markupBps: number;
  fixedMarkup: number;
  minimumMargin: number;
  pricingMode: "MANUAL" | "AUTO_MARKUP";
};
export type AdminProviderEconomics = {
  providerName: string;
  providerServiceName: string;
  externalOrderId: string;
  submissionState: string;
  providerStatus: string;
  attempts: number;
  submittedAt: string | null;
  lastCheckedAt: string | null;
  providerCost: number;
  customerCharge: number;
  grossMargin: number;
};
