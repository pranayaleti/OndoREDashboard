/**
 * Dashboard API client (Stats, Metrics, Analytics)
 */

import { apiGet, apiPost, getAuthHeaders } from "../http";
import type {
  RiskAnalytics,
  RiskRecommendation,
  AtRiskTenant,
  TenantRiskHistory,
  InlineRecommendation,
  CreateRiskInterventionRequest,
  PropertyReminderItem,
} from "./legacy-types";
import { assistantApi } from "./assistant";
import type { PendingMaintenanceDraft } from "./assistant";

export interface DashboardStats {
  propertiesCount: number;
  activeTenants: number;
  totalRevenue: number;
  pendingMaintenance: number;
  overdueInvoices: number;
}

export interface PropertyMetrics {
  propertyId: string;
  occupancyRate: number;
  monthlyRevenue: number;
  totalUnits: number;
  maintenanceRequests: number;
  averageLeaseValue: number;
}

export interface DashboardPaymentItem {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentType: string;
  propertyId: string | null;
  userId: string | null;
  description: string | null;
  createdAt: string | null;
  propertyTitle: string | null;
  propertyAddress: string | null;
  payerEmail: string | null;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const headers = getAuthHeaders();
    return apiGet<DashboardStats>("/dashboard/stats", headers);
  },

  async getPropertyMetrics(propertyId: string): Promise<PropertyMetrics> {
    const headers = getAuthHeaders();
    return apiGet<PropertyMetrics>(
      `/dashboard/property/${propertyId}/metrics`,
      headers,
    );
  },

  // getTenantAnalytics, getFinancialMetrics, getRiskMetrics, getPropertyTrends removed.
  // These called routes that do not exist in Express OR Edge (DASHBOARD-5 phantom endpoints).
  // TODO: analytics endpoint not yet implemented

  async getRiskAnalytics(windowDays?: number): Promise<RiskAnalytics> {
    const headers = getAuthHeaders();
    const query = windowDays != null ? `?windowDays=${windowDays}` : "";
    return apiGet<RiskAnalytics>(`/dashboard/at-risk/analytics${query}`, headers);
  },

  async getRecommendations(): Promise<RiskRecommendation[]> {
    const headers = getAuthHeaders();
    return apiGet<RiskRecommendation[]>("/dashboard/at-risk/recommendations", headers);
  },

  async approveRecommendation(id: string): Promise<RiskRecommendation> {
    const headers = getAuthHeaders();
    return apiPost<RiskRecommendation>(`/dashboard/at-risk/recommendations/${id}/approve`, {}, headers);
  },

  async dismissRecommendation(id: string): Promise<RiskRecommendation> {
    const headers = getAuthHeaders();
    return apiPost<RiskRecommendation>(`/dashboard/at-risk/recommendations/${id}/dismiss`, {}, headers);
  },

  async getReminders(): Promise<PropertyReminderItem[]> {
    const headers = getAuthHeaders();
    return apiGet<PropertyReminderItem[]>("/dashboard/reminders", headers);
  },

  async completeReminder(propertyId: string, reminderType: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiPost<{ message: string }>(
      "/dashboard/reminders/complete",
      { propertyId, reminderType },
      headers,
    );
  },

  async assistantChat(messages: { role: string; content: string }[], sessionId?: string): Promise<{
    reply: string;
    session_id: string | undefined;
    pending_maintenance_draft?: PendingMaintenanceDraft;
  }> {
    const chatMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));
    const res = await assistantApi.chat({ messages: chatMessages, session_id: sessionId });
    return {
      reply: res.reply ?? "",
      session_id: res.session_id,
      pending_maintenance_draft: res.pending_maintenance_draft,
    };
  },

  async assistantChatStream(
    messages: { role: string; content: string }[],
    handlers: import("./assistant").AssistantStreamHandlers,
    sessionId?: string,
  ) {
    const chatMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));
    return assistantApi.chatStream({ messages: chatMessages, session_id: sessionId }, handlers);
  },

  async confirmMaintenanceDraft(
    confirmationToken: string,
    draft: PendingMaintenanceDraft["draft"],
  ) {
    return assistantApi.confirmMaintenanceDraft(confirmationToken, draft);
  },

  async confirmShowingDraft(
    confirmationToken: string,
    draft: import("./assistant").PendingShowingDraft["draft"],
  ) {
    return assistantApi.confirmShowingDraft(confirmationToken, draft);
  },

  async getInlineRecommendation(tenantId: string): Promise<InlineRecommendation> {
    const headers = getAuthHeaders();
    return apiGet<InlineRecommendation>(`/dashboard/at-risk/${tenantId}/recommend`, headers);
  },

  async getTenantRiskHistory(tenantId: string): Promise<TenantRiskHistory> {
    const headers = getAuthHeaders();
    return apiGet<TenantRiskHistory>(`/dashboard/at-risk/${tenantId}/history`, headers);
  },

  async getAtRiskTenants(): Promise<AtRiskTenant[]> {
    const headers = getAuthHeaders();
    return apiGet<AtRiskTenant[]>("/dashboard/at-risk", headers);
  },

  async refreshAtRiskScores(): Promise<{ message: string; tenantsScored?: number }> {
    const headers = getAuthHeaders();
    return apiPost<{ message: string; tenantsScored?: number }>("/dashboard/at-risk/refresh", {}, headers);
  },

  async createRiskIntervention(
    request: CreateRiskInterventionRequest,
  ): Promise<{ id: string; message?: string }> {
    const headers = getAuthHeaders();
    return apiPost<{ id: string; message?: string }>(
      "/dashboard/at-risk/interventions",
      request,
      headers,
    );
  },

  /** Rent payments for scoped properties (Owner/Manager/Admin). */
  async getDashboardPayments(page = 1, limit = 20): Promise<{
    data: DashboardPaymentItem[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: DashboardPaymentItem[]; pagination: { page: number; limit: number; total: number } }>(
      `/dashboard/payments?page=${page}&limit=${limit}`,
      headers,
    );
  },
};
