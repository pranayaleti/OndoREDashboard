/**
 * Dashboard API client (Stats, Metrics, Analytics)
 */

import { apiGet, getAuthHeaders } from "../http";

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

export interface TenantAnalytics {
  totalTenants: number;
  activeTenants: number;
  churnRate: number;
  averageLeaseDuration: number;
  latePayments: number;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  monthlyTrend: {
    month: string;
    income: number;
    expenses: number;
  }[];
}

export interface RiskMetrics {
  riskScore: number;
  propertyAtRisk: number;
  tenantRiskFactors: Record<string, number>;
  recommendations: string[];
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

  async getTenantAnalytics(): Promise<TenantAnalytics> {
    const headers = getAuthHeaders();
    return apiGet<TenantAnalytics>("/dashboard/tenant-analytics", headers);
  },

  async getFinancialMetrics(period: string = "monthly"): Promise<FinancialMetrics> {
    const headers = getAuthHeaders();
    return apiGet<FinancialMetrics>(
      `/dashboard/financial-metrics?period=${period}`,
      headers,
    );
  },

  async getRiskMetrics(): Promise<RiskMetrics> {
    const headers = getAuthHeaders();
    return apiGet<RiskMetrics>("/dashboard/risk-metrics", headers);
  },

  async getPropertyTrends(propertyId: string, months: number = 12): Promise<{
    revenue: { month: string; value: number }[];
    occupancy: { month: string; rate: number }[];
  }> {
    const headers = getAuthHeaders();
    return apiGet(
      `/dashboard/property/${propertyId}/trends?months=${months}`,
      headers,
    );
  },
};
