/**
 * Tenant Screening API client
 */

import { apiGet, apiPost, apiPut, getAuthHeaders } from "../http";

export interface TenantScreening {
  id: string;
  tenantId: string;
  propertyId: string;
  status: "pending" | "approved" | "rejected" | "review";
  creditScore?: number;
  backgroundCheckPassed?: boolean;
  incomeVerification?: {
    verified: boolean;
    monthlyIncome: number;
  };
  rentalHistory?: {
    yearsAsRenter: number;
    evictions: number;
  };
  flags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningReport {
  screeningId: string;
  summary: string;
  riskLevel: "low" | "medium" | "high";
  creditInfo?: {
    score: number;
    delinquencies: number;
  };
  backgroundInfo?: {
    convictions: string[];
    evictions: number;
  };
  incomeInfo?: {
    monthly: number;
    source: string;
  };
  recommendations: string[];
}

export const tenantScreeningApi = {
  async submitScreening(
    tenantId: string,
    propertyId: string,
    data: Record<string, unknown>,
  ): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPost<TenantScreening>(
      "/tenant-screening",
      { tenantId, propertyId, ...data },
      headers,
    );
  },

  async getScreening(id: string): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiGet<TenantScreening>(`/tenant-screening/${id}`, headers);
  },

  async getScreeningsByProperty(propertyId: string): Promise<TenantScreening[]> {
    const headers = getAuthHeaders();
    return apiGet<TenantScreening[]>(
      `/tenant-screening/property/${propertyId}`,
      headers,
    );
  },

  async getScreeningReport(screeningId: string): Promise<ScreeningReport> {
    const headers = getAuthHeaders();
    return apiGet<ScreeningReport>(
      `/tenant-screening/${screeningId}/report`,
      headers,
    );
  },

  async approveScreening(id: string, notes?: string): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPut<TenantScreening>(
      `/tenant-screening/${id}/approve`,
      { notes },
      headers,
    );
  },

  async rejectScreening(id: string, reason: string): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPut<TenantScreening>(
      `/tenant-screening/${id}/reject`,
      { reason },
      headers,
    );
  },

  async requestAdditionalInfo(
    id: string,
    requiredInfo: string[],
  ): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPut<TenantScreening>(
      `/tenant-screening/${id}/request-info`,
      { requiredInfo },
      headers,
    );
  },
};
