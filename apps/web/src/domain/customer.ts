export type SocialPlatform = "facebook" | "tiktok" | "instagram" | "youtube" | "threads";
export type CustomerOrderStatus = "Processing" | "Completed" | "Pending" | "Failed" | "Cancelled" | "Partial" | "Refunded";
export type ServiceStatus = "Active" | "Paused" | "Maintenance";
export type TicketStatus = "Open" | "Waiting" | "Resolved" | "Closed";
export type TransactionType = "Deposit" | "Purchase" | "Refund" | "Adjustment";
export type TransactionStatus = "Completed" | "Pending" | "Failed";

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  security: { twoFactorEnabled: boolean; lastPasswordChange: string };
  notifications: { orderUpdates: boolean; walletUpdates: boolean; promotions: boolean; supportReplies: boolean };
};

export type Wallet = { balance: number; currency: "VND" };

export type ServiceCategory = {
  id: string;
  name: string;
};

export type Service = {
  id: string;
  code: string;
  platform: SocialPlatform;
  category: string;
  name: string;
  description: string;
  ratePerThousand: number;
  min: number;
  max: number;
  status: ServiceStatus;
  averageTime: string;
  popular?: boolean;
};

export type Order = {
  id: string;
  serviceId: string;
  serviceName: string;
  platform: SocialPlatform;
  targetUrl: string;
  quantity: number;
  startCount?: number;
  charge: number;
  remaining: number;
  status: CustomerOrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type DashboardData = {
  profile: CustomerProfile;
  wallet: Wallet;
  runningOrders: number;
  completedOrders: number;
  totalSpent: number;
  popularPlatform: SocialPlatform;
  popularServices: Service[];
  recentOrders: Order[];
};

export type ServiceFilters = {
  search?: string;
  platform?: SocialPlatform | "all";
  category?: string | "all";
};

export type OrderFilters = {
  search?: string;
  platform?: SocialPlatform | "all";
  status?: CustomerOrderStatus | "all";
  dateRange?: "all" | "7d" | "30d" | "90d";
};

export type CreateOrderInput = {
  serviceId: string;
  targetUrl: string;
  quantity: number;
};

export type WalletTransaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  balanceAfter: number;
  date: string;
  status: TransactionStatus;
  reference?: string;
};

export type DepositMethod = {
  id: string;
  name: string;
  type: "bank" | "qr" | "manual";
  description: string;
  min: number;
  max: number;
  feeLabel: string;
  enabled: boolean;
  instructions: string[];
};

export type DepositRequest = {
  id: string;
  methodId: string;
  amount: number;
  status: "Pending";
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  sender: "customer" | "admin";
  senderName: string;
  body: string;
  createdAt: string;
};

export type SupportThread = {
  ticket: SupportTicket;
  messages: SupportMessage[];
};

export type CreateTicketInput = {
  subject: string;
  category: string;
  message: string;
};

export type AuthResult = {
  ok: true;
  user: Pick<CustomerProfile, "id" | "name" | "email">;
};
