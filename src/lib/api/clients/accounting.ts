/**
 * Accounting API client (Payments, Invoices, Expenses)
 */

import { apiGet, apiPost, apiPut, getAuthHeaders } from "../http";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  date: string;
  propertyId?: string;
  tenantId?: string;
  description?: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  tenantId: string;
  propertyId: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  propertyId: string;
  receipt?: string;
  status: "approved" | "pending" | "rejected";
}

export const accountingApi = {
  async getPayments(
    propertyId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ payments: Payment[]; total: number; page: number }> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (propertyId) query.append("propertyId", propertyId);
    query.append("page", String(page));
    query.append("pageSize", String(pageSize));

    return apiGet(`/payments?${query.toString()}`, headers);
  },

  async getPayment(id: string): Promise<Payment> {
    const headers = getAuthHeaders();
    return apiGet<Payment>(`/payments/${id}`, headers);
  },

  async createPayment(request: Partial<Payment>): Promise<Payment> {
    const headers = getAuthHeaders();
    return apiPost<Payment>("/payments", request, headers);
  },

  async getInvoices(
    propertyId?: string,
    page: number = 1,
  ): Promise<{ invoices: Invoice[]; total: number; page: number }> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (propertyId) query.append("propertyId", propertyId);
    query.append("page", String(page));

    return apiGet(`/invoices?${query.toString()}`, headers);
  },

  async getInvoice(id: string): Promise<Invoice> {
    const headers = getAuthHeaders();
    return apiGet<Invoice>(`/invoices/${id}`, headers);
  },

  async createInvoice(request: Partial<Invoice>): Promise<Invoice> {
    const headers = getAuthHeaders();
    return apiPost<Invoice>("/invoices", request, headers);
  },

  async sendInvoice(id: string): Promise<Invoice> {
    const headers = getAuthHeaders();
    return apiPut<Invoice>(`/invoices/${id}/send`, {}, headers);
  },

  async getExpenses(
    propertyId?: string,
    page: number = 1,
  ): Promise<{ expenses: Expense[]; total: number; page: number }> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (propertyId) query.append("propertyId", propertyId);
    query.append("page", String(page));

    return apiGet(`/expenses?${query.toString()}`, headers);
  },

  async createExpense(request: Partial<Expense>): Promise<Expense> {
    const headers = getAuthHeaders();
    return apiPost<Expense>("/expenses", request, headers);
  },

  async approveExpense(id: string): Promise<Expense> {
    const headers = getAuthHeaders();
    return apiPut<Expense>(`/expenses/${id}/approve`, {}, headers);
  },

  async rejectExpense(id: string, reason?: string): Promise<Expense> {
    const headers = getAuthHeaders();
    return apiPut<Expense>(`/expenses/${id}/reject`, { reason }, headers);
  },
};
