/**
 * Lead API client — inbox CRM + existing score / site-visit helpers.
 */

import { apiGet, apiPost, apiPut, apiRequest, getAuthHeaders } from "../http";
import type { Lead } from "../clients/legacy-types";

export type { Lead } from "../clients/legacy-types";

export type LeadKind = "property" | "website";
export type InboxFilter = "all" | "mine" | "unclaimed";
export type LeadInboxStatus = "new" | "contacted" | "qualified" | "converted" | "closed";
export type InquiryType =
  | "owner"
  | "renter"
  | "buyer"
  | "seller"
  | "agent"
  | "current_client"
  | "vendor"
  | "other";
export type ActivityType = "note" | "call" | "email" | "task";

export interface LeadScore {
  score: number;
  temperature: "HOT" | "WARM" | "COLD";
  breakdown: {
    budget?: number;
    urgency?: number;
    completeness?: number;
    quality?: number;
    bonus?: number;
    engagement?: number;
  };
  qualificationAnswers: Record<string, unknown>;
  scoredAt: string;
}

export interface InboxLead {
  id: string;
  kind: LeadKind;
  inquiryType: InquiryType | "renter" | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: LeadInboxStatus;
  source: string | null;
  managerId: string | null;
  claimedAt: string | null;
  lastActivityAt: string;
  overdueTaskCount: number;
  propertyId: string | null;
  createdAt: string;
  updatedAt: string | null;
  propertyTitle: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  /** Present when the list is fetched with `include=score`. */
  score?: LeadScore | null;
}

export interface LeadWorkEvent {
  id: string;
  kind: LeadKind;
  leadId: string;
  actorId: string | null;
  type: "note" | "call" | "email" | "task" | "system";
  body: string | null;
  dueAt: string | null;
  completedAt: string | null;
  occurredAt: string;
}

export interface DuplicateHint {
  kind: LeadKind;
  id: string;
  name: string;
}

export interface InboxListResponse {
  data: InboxLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
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
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
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

export interface ConvertLeadResponse {
  message: string;
  lead: InboxLead;
  conversion: { type: string; id: string } | null;
}

function inboxToLegacyLead(item: InboxLead): Lead {
  return {
    id: item.id,
    propertyId: item.propertyId ?? "",
    tenantName: item.name,
    tenantEmail: item.email,
    tenantPhone: item.phone ?? "",
    message: item.message ?? undefined,
    status: item.status,
    source: item.source ?? "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
    propertyTitle: item.propertyTitle ?? "",
    propertyType: "",
    propertyAddress: item.propertyAddress ?? "",
    propertyCity: item.propertyCity ?? "",
  };
}

export function isUnclaimedLead(lead: InboxLead): boolean {
  return lead.managerId === null && lead.claimedAt === null;
}

export function isQueueConvert(lead: InboxLead): boolean {
  if (lead.kind === "property") return false;
  if (lead.inquiryType === "renter" || lead.inquiryType === "owner") return false;
  return true;
}

export const leadApi = {
  async getInbox(params: {
    page?: number;
    limit?: number;
    filter?: InboxFilter;
    status?: LeadInboxStatus;
    kind?: LeadKind;
    inquiryType?: InquiryType;
    q?: string;
    include?: "score";
  } = {}): Promise<InboxListResponse> {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 100));
    if (params.filter) qs.set("filter", params.filter);
    if (params.status) qs.set("status", params.status);
    if (params.kind) qs.set("kind", params.kind);
    if (params.inquiryType) qs.set("inquiryType", params.inquiryType);
    if (params.q?.trim()) qs.set("q", params.q.trim());
    if (params.include) qs.set("include", params.include);
    const headers = getAuthHeaders();
    return apiGet<InboxListResponse>(`/leads?${qs.toString()}`, headers);
  },

  async getLeads(page: number = 1, pageSize: number = 20): Promise<LeadListResponse> {
    const inbox = await this.getInbox({ page, limit: pageSize, filter: "all" });
    return {
      data: inbox.data.map(inboxToLegacyLead),
      pagination: inbox.pagination,
    };
  },

  async getLead(kind: LeadKind, id: string): Promise<{ lead: InboxLead; duplicateHint: DuplicateHint[] }> {
    const headers = getAuthHeaders();
    const res = await apiGet<{ message: string; data: InboxLead; duplicateHint?: DuplicateHint[] }>(
      `/leads/${kind}/${id}`,
      headers,
    );
    return { lead: res.data, duplicateHint: res.duplicateHint ?? [] };
  },

  async submitLead(request: SubmitLeadRequest): Promise<Lead> {
    return apiPost<Lead>("/leads", request);
  },

  async updateLeadStatus(id: string, status: string): Promise<Lead> {
    const headers = getAuthHeaders();
    return apiPut<Lead>(`/leads/${id}/status`, { status }, headers);
  },

  async updateInboxStatus(kind: LeadKind, id: string, status: LeadInboxStatus): Promise<InboxLead> {
    const res = await apiRequest<{ message: string; lead: InboxLead }>(
      "PATCH",
      `/leads/${kind}/${id}/status`,
      { status },
    );
    return res.lead;
  },

  async claimLead(kind: LeadKind, id: string): Promise<InboxLead> {
    const res = await apiPost<{ message: string; data: InboxLead }>(`/leads/${kind}/${id}/claim`);
    return res.data;
  },

  async getActivities(kind: LeadKind, id: string): Promise<LeadWorkEvent[]> {
    const res = await apiGet<{ message: string; data: LeadWorkEvent[] }>(
      `/leads/${kind}/${id}/activities`,
      getAuthHeaders(),
    );
    return res.data ?? [];
  },

  async addActivity(
    kind: LeadKind,
    id: string,
    body: { type: ActivityType; body: string; dueAt?: string },
  ): Promise<LeadWorkEvent> {
    const res = await apiPost<{ message: string; data: LeadWorkEvent }>(
      `/leads/${kind}/${id}/activities`,
      body,
    );
    return res.data;
  },

  async completeTask(kind: LeadKind, id: string, eventId: string, completedAt: string): Promise<LeadWorkEvent> {
    const res = await apiRequest<{ message: string; data: LeadWorkEvent }>(
      "PATCH",
      `/leads/${kind}/${id}/activities/${eventId}`,
      { completedAt },
    );
    return res.data;
  },

  async convertLead(
    kind: LeadKind,
    id: string,
    body: { outcome?: "converted" | "closed"; propertyId?: string } = {},
  ): Promise<ConvertLeadResponse> {
    return apiPost<ConvertLeadResponse>(`/leads/${kind}/${id}/convert`, body);
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
    const res = await this.getInbox({ page: 1, limit: 100, kind: "property" });
    return (res.data ?? []).map(inboxToLegacyLead);
  },

  async getLeadScore(leadId: string): Promise<LeadScore | null> {
    const headers = getAuthHeaders();
    return apiGet<LeadScore>(`/leads/${leadId}/score`, headers).catch(() => null);
  },

  async getWebsiteLeadScore(leadId: string): Promise<LeadScore | null> {
    const headers = getAuthHeaders();
    return apiGet<LeadScore>(`/leads/website/${leadId}/score`, headers).catch(() => null);
  },

  async getSiteVisits(params: { leadId?: string; status?: string; kind?: LeadKind }): Promise<SiteVisit[]> {
    const qs = new URLSearchParams();
    if (params.leadId) qs.set("leadId", params.leadId);
    if (params.status) qs.set("status", params.status);
    if (params.kind) qs.set("kind", params.kind);
    const headers = getAuthHeaders();
    return apiGet<SiteVisit[]>(`/site-visits?${qs}`, headers);
  },

  async proposeSiteVisit(body: {
    kind?: "property" | "website";
    leadId: string;
    propertyId: string;
    proposedSlots: string[];
    notes?: string;
  }): Promise<{ id: string }> {
    const headers = getAuthHeaders();
    return apiPost<{ id: string }>("/site-visits", body, headers);
  },

  async updateSiteVisitStatus(visitId: string, status: "cancelled" | "completed"): Promise<void> {
    return apiRequest<void>("PATCH", `/site-visits/${visitId}/status`, { status });
  },
};
