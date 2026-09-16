import type {
  AdminAnalytics, AdminAuditLog, AdminCategory, AdminCategoryInput, AdminDashboard, AdminDeposit, AdminOrder, AdminOrderDetail, AdminPage,
  AdminProvider, AdminProviderDetail, AdminProviderMappingInput, AdminService, AdminServiceDetail, AdminServiceInput, AdminSettings, AdminSupportThread, AdminSupportTicket, AdminTransaction,
  AdminUserDetail, AdminUserListItem, AdminWallet
} from "@/domain/admin";

export interface AdminRepository {
  getDashboard(): Promise<AdminDashboard>;
  listUsers(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminUserListItem>>;
  getUser(id: string): Promise<AdminUserDetail>;
  setUserStatus(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<AdminUserDetail>;
  adjustWallet(id: string, amount: number, reason: string): Promise<AdminTransaction>;
  listOrders(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminOrder>>;
  getOrder(id: string): Promise<AdminOrderDetail>;
  refundOrder(id: string, reason: string): Promise<AdminOrderDetail>;
  listServices(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminService>>;
  getService(id: string): Promise<AdminServiceDetail>;
  createService(input: AdminServiceInput): Promise<AdminServiceDetail>;
  updateService(id: string, input: AdminServiceInput): Promise<AdminServiceDetail>;
  listCategories(): Promise<AdminCategory[]>;
  createCategory(input: AdminCategoryInput): Promise<AdminCategory>;
  updateCategory(id: string, input: AdminCategoryInput): Promise<AdminCategory>;
  listWallets(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminWallet>>;
  listTransactions(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminTransaction>>;
  listDeposits(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminDeposit>>;
  getDeposit(id: string): Promise<AdminDeposit>;
  confirmDeposit(id: string, reason: string): Promise<AdminDeposit>;
  failDeposit(id: string, reason: string): Promise<AdminDeposit>;
  cancelDeposit(id: string, reason: string): Promise<AdminDeposit>;
  listSupport(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminSupportTicket>>;
  getSupport(id: string): Promise<AdminSupportThread>;
  sendSupportReply(id: string, body: string): Promise<AdminSupportThread>;
  setSupportStatus(id: string, status: string): Promise<AdminSupportThread>;
  getAnalytics(range?: "7d" | "30d"): Promise<AdminAnalytics>;
  listAuditLogs(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminAuditLog>>;
  getSettings(): Promise<AdminSettings>;
  updateSettings(input: Omit<AdminSettings, "updatedAt">): Promise<AdminSettings>;
  listProviders(filters?: Record<string, string | number | undefined>): Promise<AdminPage<AdminProvider>>;
  getProvider(id: string): Promise<AdminProviderDetail>;
  setProviderEnabled(id: string, enabled: boolean): Promise<AdminProviderDetail>;
  runProviderAction(id: string, action: "TEST_CONNECTION" | "SYNC_SERVICES" | "SYNC_BALANCE"): Promise<{ id: string; type: string; status: string }>;
  saveProviderMapping(input: AdminProviderMappingInput): Promise<{ id: string; status: string; enabled: boolean }>;
  disableProviderMapping(id: string): Promise<{ id: string; status: string; enabled: boolean }>;
}
