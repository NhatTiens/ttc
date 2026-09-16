import type {
  AuthResult,
  CreateOrderInput,
  CreateTicketInput,
  CustomerProfile,
  DashboardData,
  DepositMethod,
  DepositRequest,
  Order,
  OrderFilters,
  Service,
  ServiceCategory,
  ServiceFilters,
  SupportMessage,
  SupportThread,
  SupportTicket,
  Wallet,
  WalletTransaction
} from "@/domain/customer";

export interface CustomerRepository {
  getShellData(): Promise<{ profile: CustomerProfile; wallet: Wallet }>;
  getDashboard(): Promise<DashboardData>;
  listCategories(): Promise<ServiceCategory[]>;
  listServices(filters?: ServiceFilters): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  listOrders(filters?: OrderFilters): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  getWallet(): Promise<Wallet>;
  listWalletTransactions(): Promise<WalletTransaction[]>;
  listDepositMethods(): Promise<DepositMethod[]>;
  createDeposit(methodId: string, amount: number): Promise<DepositRequest>;
  listTickets(): Promise<SupportTicket[]>;
  getTicket(id: string): Promise<SupportThread | null>;
  createTicket(input: CreateTicketInput): Promise<SupportTicket>;
  sendSupportMessage(ticketId: string, body: string): Promise<SupportMessage>;
  getProfile(): Promise<CustomerProfile>;
  updateProfile(input: Pick<CustomerProfile, "name" | "email" | "phone">): Promise<CustomerProfile>;
  changePassword(currentPassword: string, nextPassword: string): Promise<void>;
  updateNotificationPreferences(input: CustomerProfile["notifications"]): Promise<CustomerProfile>;
  login(email: string, password: string): Promise<AuthResult>;
  register(name: string, email: string, password: string): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<void>;
  logout(): Promise<void>;
}
