import type { CustomerRepository } from "@/repositories/customer-repository";
import type { OrderFilters, ServiceFilters } from "@/domain/customer";
import { restCustomerRepository } from "@/repositories/rest-customer-repository";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  getShellData() { return this.repository.getShellData(); }
  getDashboard() { return this.repository.getDashboard(); }
  listCategories() { return this.repository.listCategories(); }
  listServices(filters?: ServiceFilters) { return this.repository.listServices(filters); }
  getService(id: string) { return this.repository.getService(id); }
  listOrders(filters?: OrderFilters) { return this.repository.listOrders(filters); }
  getOrder(id: string) { return this.repository.getOrder(id); }
  createOrder(input: Parameters<CustomerRepository["createOrder"]>[0]) { return this.repository.createOrder(input); }
  getWallet() { return this.repository.getWallet(); }
  listWalletTransactions() { return this.repository.listWalletTransactions(); }
  listDepositMethods() { return this.repository.listDepositMethods(); }
  createDeposit(methodId: string, amount: number) { return this.repository.createDeposit(methodId, amount); }
  listTickets() { return this.repository.listTickets(); }
  getTicket(id: string) { return this.repository.getTicket(id); }
  createTicket(input: Parameters<CustomerRepository["createTicket"]>[0]) { return this.repository.createTicket(input); }
  sendSupportMessage(ticketId: string, body: string) { return this.repository.sendSupportMessage(ticketId, body); }
  getProfile() { return this.repository.getProfile(); }
  updateProfile(input: Parameters<CustomerRepository["updateProfile"]>[0]) { return this.repository.updateProfile(input); }
  changePassword(currentPassword: string, nextPassword: string) { return this.repository.changePassword(currentPassword, nextPassword); }
  updateNotificationPreferences(input: Parameters<CustomerRepository["updateNotificationPreferences"]>[0]) { return this.repository.updateNotificationPreferences(input); }
  login(email: string, password: string) { return this.repository.login(email, password); }
  register(name: string, email: string, password: string) { return this.repository.register(name, email, password); }
  requestPasswordReset(email: string) { return this.repository.requestPasswordReset(email); }
  logout() { return this.repository.logout(); }
}

export const customerService = new CustomerService(restCustomerRepository);
