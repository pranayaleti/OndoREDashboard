/**
 * Lead API client
 */

import { apiGet, apiPost, apiPut, getAuthHeaders } from "../http";
import type { Lead } from "../clients/legacy-types";

export type { Lead } from "../clients/legacy-types";

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
};
