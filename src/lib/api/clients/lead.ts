/**
 * Lead API client
 */

import { apiGet, apiPost, apiPut, apiRequest, getAuthHeaders } from "../http";
import type { Lead } from "../clients/legacy-types";

export type { Lead } from "../clients/legacy-types";

export interface LeadScore {
  score: number;
  temperature: "HOT" | "WARM" | "COLD";
  breakdown: { budget?: number; urgency?: number; completeness?: number; quality?: number; bonus?: number; engagement?: number };
  qualificationAnswers: Record<string, unknown>;
  scoredAt: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  propertyId: string;
  status: "proposed" | "confirmed" | "cancelled" | "completed";
  proposedSlots: string[];
  scheduledAt: string | null;
  slotIndex: number | null;
  notes: string | null;
  createdAt: string;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubmitLeadRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  message?: string;
  source?: string;
  propertyId?: string;
}

export const leadApi = {
  async getLeads(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<LeadListResponse> {
    const headers = getAuthHeaders();
    return apiGet<LeadListResponse>(
      `/leads?page=${page}&pageSize=${pageSize}`,
      headers,
    );
  },

  async getLead(id: string): Promise<Lead> {
    const headers = getAuthHeaders();
    return apiGet<Lead>(`/leads/${id}`, headers);
  },

  async submitLead(request: SubmitLeadRequest): Promise<Lead> {
    return apiPost<Lead>("/leads", request);
  },

  async updateLeadStatus(id: string, status: string): Promise<Lead> {
    const headers = getAuthHeaders();
    return apiPut<Lead>(`/leads/${id}/status`, { status }, headers);
  },

  async assignLead(id: string, ownerId: string): Promise<Lead> {
    const headers = getAuthHeaders();
    return apiPut<Lead>(`/leads/${id}/assign`, { ownerId }, headers);
  },

  async getLeadsByProperty(propertyId: string): Promise<Lead[]> {
    const headers = getAuthHeaders();
    return apiGet<Lead[]>(`/leads/property/${propertyId}`, headers);
  },

  async getManagerLeads(): Promise<Lead[]> {
    const res = await this.getLeads(1, 500);
    return res.leads;
  },

  async getLeadScore(leadId: string): Promise<LeadScore | null> {
    const headers = getAuthHeaders();
    return apiGet<LeadScore>(`/leads/${leadId}/score`, headers).catch(() => null);
  },

  async getWebsiteLeadScore(leadId: string): Promise<LeadScore | null> {
    const headers = getAuthHeaders();
    return apiGet<LeadScore>(`/leads/website/${leadId}/score`, headers).catch(() => null);
  },

  async getSiteVisits(params: { leadId?: string; status?: string }): Promise<SiteVisit[]> {
    const qs = new URLSearchParams();
    if (params.leadId) qs.set("leadId", params.leadId);
    if (params.status) qs.set("status", params.status);
    const headers = getAuthHeaders();
    return apiGet<SiteVisit[]>(`/site-visits?${qs}`, headers);
  },

  async proposeSiteVisit(body: { leadId: string; propertyId: string; proposedSlots: string[]; notes?: string }): Promise<{ id: string }> {
    const headers = getAuthHeaders();
    return apiPost<{ id: string }>("/site-visits", body, headers);
  },

  async updateSiteVisitStatus(visitId: string, status: "cancelled" | "completed"): Promise<void> {
    return apiRequest<void>("PATCH", `/site-visits/${visitId}/status`, { status });
  },
};
