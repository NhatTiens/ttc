import type { CustomerRepository } from "@/repositories/customer-repository";
import type { CreateOrderInput, CreateTicketInput, CustomerProfile, OrderFilters, ServiceFilters, SocialPlatform } from "@/domain/customer";
import { calculateOrderCost } from "@/lib/format";
import { mockCategories, mockDepositMethods, mockOrders, mockProfile, mockServices, mockSupportMessages, mockTickets, mockTransactions, mockWallet } from "./mock-customer-data";

function delay(ms = 180) {
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
}

function includes(value: string, query: string) {
  return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

let orderSerial = 1100;
let ticketSerial = 40;
let depositSerial = 10;

export const mockCustomerRepository: CustomerRepository = {
  async getShellData() {
    await delay(80);
    return { profile: { ...mockProfile }, wallet: { ...mockWallet } };
  },

  async getDashboard() {
    await delay();
    const completed = mockOrders.filter((order) => order.status === "Completed");
    const running = mockOrders.filter((order) => order.status === "Processing" || order.status === "Pending");
    const counts = mockOrders.reduce<Record<SocialPlatform, number>>((result, order) => {
      result[order.platform] += 1;
      return result;
    }, { facebook: 0, tiktok: 0, instagram: 0, youtube: 0, threads: 0 });
    const popularPlatform = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "facebook") as SocialPlatform;
    return {
      profile: { ...mockProfile },
      wallet: { ...mockWallet },
      runningOrders: running.length,
      completedOrders: completed.length,
      totalSpent: mockTransactions.filter((item) => item.type === "Purchase" && item.status === "Completed").reduce((sum, item) => sum + Math.abs(item.amount), 0),
      popularPlatform,
      popularServices: mockServices.filter((service) => service.popular && service.status === "Active").slice(0, 4),
      recentOrders: [...mockOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
    };
  },

  async listCategories() {
    await delay(80);
    return mockCategories.map((item) => ({ ...item }));
  },

  async listServices(filters: ServiceFilters = {}) {
    await delay();
    const query = filters.search?.trim() ?? "";
    return mockServices.filter((service) => {
      if (filters.platform && filters.platform !== "all" && service.platform !== filters.platform) return false;
      if (filters.category && filters.category !== "all" && service.category !== filters.category) return false;
      if (query && !includes(`${service.code} ${service.name} ${service.description}`, query)) return false;
      return true;
    }).map((service) => ({ ...service }));
  },

  async getService(id: string) {
    await delay(100);
    const service = mockServices.find((item) => item.id === id);
    return service ? { ...service } : null;
  },

  async listOrders(filters: OrderFilters = {}) {
    await delay();
    const query = filters.search?.trim() ?? "";
    const now = new Date("2026-09-16T01:00:00+07:00").getTime();
    const dayCount = filters.dateRange === "7d" ? 7 : filters.dateRange === "30d" ? 30 : filters.dateRange === "90d" ? 90 : null;
    return mockOrders.filter((order) => {
      if (filters.platform && filters.platform !== "all" && order.platform !== filters.platform) return false;
      if (filters.status && filters.status !== "all" && order.status !== filters.status) return false;
      if (query && !includes(`${order.id} ${order.serviceName} ${order.targetUrl}`, query)) return false;
      if (dayCount && now - new Date(order.createdAt).getTime() > dayCount * 86400000) return false;
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((order) => ({ ...order }));
  },

  async getOrder(id: string) {
    await delay();
    const order = mockOrders.find((item) => item.id === id);
    return order ? { ...order } : null;
  },

  async createOrder(input: CreateOrderInput) {
    await delay(520);
    const service = mockServices.find((item) => item.id === input.serviceId);
    if (!service) throw new Error("Dịch vụ đã chọn không còn khả dụng.");
    if (service.status !== "Active") throw new Error("Dịch vụ này hiện không nhận đơn mới.");
    if (input.quantity < service.min || input.quantity > service.max) throw new Error(`Số lượng phải từ ${service.min} đến ${service.max}.`);
    const charge = calculateOrderCost(service.ratePerThousand, input.quantity);
    if (mockWallet.balance < charge) throw new Error("Số dư ví không đủ để tạo đơn này.");
    orderSerial += 1;
    const now = new Date().toISOString();
    const order = {
      id: `TT-MOCK-${orderSerial}`,
      serviceId: service.id,
      serviceName: service.name,
      platform: service.platform,
      targetUrl: input.targetUrl,
      quantity: input.quantity,
      charge,
      remaining: input.quantity,
      status: "Pending" as const,
      createdAt: now,
      updatedAt: now
    };
    mockWallet.balance -= charge;
    mockOrders.unshift(order);
    mockTransactions.unshift({ id: `TXN-MOCK-${orderSerial}`, type: "Purchase", description: `Đơn hàng ${order.id}`, amount: -charge, balanceAfter: mockWallet.balance, date: now, status: "Completed", reference: order.id });
    return { ...order };
  },

  async getWallet() {
    await delay(80);
    return { ...mockWallet };
  },

  async listWalletTransactions() {
    await delay();
    return mockTransactions.map((item) => ({ ...item }));
  },

  async listDepositMethods() {
    await delay();
    return mockDepositMethods.map((item) => ({ ...item, instructions: [...item.instructions] }));
  },

  async createDeposit(methodId: string, amount: number) {
    await delay(460);
    const method = mockDepositMethods.find((item) => item.id === methodId && item.enabled);
    if (!method) throw new Error("Phương thức nạp tiền này hiện không khả dụng.");
    if (amount < method.min || amount > method.max) throw new Error(`Số tiền nạp phải từ ${method.min} đến ${method.max}.`);
    depositSerial += 1;
    const id = `DEP-MOCK-${depositSerial}`;
    const createdAt = new Date().toISOString();
    mockTransactions.unshift({
      id: `TXN-MOCK-DEP-${depositSerial}`,
      type: "Deposit",
      description: `Yêu cầu nạp tiền ${id}`,
      amount,
      balanceAfter: mockWallet.balance,
      date: createdAt,
      status: "Pending",
      reference: id
    });
    return { id, methodId, amount, status: "Pending" as const, createdAt };
  },

  async listTickets() {
    await delay();
    return [...mockTickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((ticket) => ({ ...ticket }));
  },

  async getTicket(id: string) {
    await delay();
    const ticket = mockTickets.find((item) => item.id === id);
    if (!ticket) return null;
    return { ticket: { ...ticket }, messages: mockSupportMessages.filter((message) => message.ticketId === id).map((message) => ({ ...message })) };
  },

  async createTicket(input: CreateTicketInput) {
    await delay(420);
    ticketSerial += 1;
    const now = new Date().toISOString();
    const ticket = { id: `SUP-MOCK-${ticketSerial}`, subject: input.subject, category: input.category, status: "Open" as const, createdAt: now, updatedAt: now, lastMessage: input.message };
    mockTickets.unshift(ticket);
    mockSupportMessages.push({ id: `MSG-MOCK-${ticketSerial}-1`, ticketId: ticket.id, sender: "customer", senderName: mockProfile.name, body: input.message, createdAt: now });
    return { ...ticket };
  },

  async sendSupportMessage(ticketId: string, body: string) {
    await delay(360);
    const ticket = mockTickets.find((item) => item.id === ticketId);
    if (!ticket) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");
    const message = { id: `MSG-MOCK-${Date.now()}`, ticketId, sender: "customer" as const, senderName: mockProfile.name, body, createdAt: new Date().toISOString() };
    mockSupportMessages.push(message);
    ticket.lastMessage = body;
    ticket.updatedAt = message.createdAt;
    ticket.status = "Open";
    return { ...message };
  },

  async getProfile() {
    await delay();
    return { ...mockProfile, security: { ...mockProfile.security }, notifications: { ...mockProfile.notifications } };
  },

  async updateProfile(input: Pick<CustomerProfile, "name" | "email" | "phone">) {
    await delay(420);
    mockProfile.name = input.name;
    mockProfile.email = input.email;
    mockProfile.phone = input.phone;
    return { ...mockProfile, security: { ...mockProfile.security }, notifications: { ...mockProfile.notifications } };
  },

  async changePassword(currentPassword: string, nextPassword: string) {
    await delay(460);
    if (!currentPassword || !nextPassword) throw new Error("Vui lòng nhập đầy đủ các trường mật khẩu.");
    mockProfile.security.lastPasswordChange = new Date().toISOString();
  },

  async updateNotificationPreferences(input: CustomerProfile["notifications"]) {
    await delay(340);
    mockProfile.notifications = { ...input };
    return { ...mockProfile, security: { ...mockProfile.security }, notifications: { ...mockProfile.notifications } };
  },

  async login(email: string, password: string) {
    await delay(500);
    if (!email || !password) throw new Error("Vui lòng nhập email và mật khẩu.");
    return { ok: true as const, user: { id: mockProfile.id, name: mockProfile.name, email } };
  },

  async register(name: string, email: string, password: string) {
    await delay(560);
    if (!name || !email || !password) throw new Error("Vui lòng điền đầy đủ các trường bắt buộc.");
    return { ok: true as const, user: { id: "usr_mock_new", name, email } };
  },

  async requestPasswordReset(email: string) {
    await delay(480);
    if (!email) throw new Error("Vui lòng nhập email.");
  },

  async logout() { await delay(80); }
};
