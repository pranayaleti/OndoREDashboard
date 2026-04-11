/**
 * Maintenance API client
 */

import {
  MaintenanceRequest,
} from "@ondo/types";
import { apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "../http";

function extractMaintenanceRequests(raw: unknown): MaintenanceRequest[] {
  if (Array.isArray(raw)) return raw as MaintenanceRequest[];
  if (typeof raw === "object" && raw !== null && "data" in raw) {
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) return data as MaintenanceRequest[];
  }
  return [];
}

function extractMaintenanceRequest(raw: unknown): MaintenanceRequest {
  if (typeof raw === "object" && raw !== null) {
    if ("request" in raw && typeof (raw as { request?: unknown }).request === "object") {
      return (raw as { request: MaintenanceRequest }).request;
    }
    if ("data" in raw && typeof (raw as { data?: unknown }).data === "object") {
      return (raw as { data: MaintenanceRequest }).data;
    }
  }
  return raw as MaintenanceRequest;
}

export interface MaintenanceListResponse {
  data: MaintenanceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage?: number;
  };
}

export const maintenanceApi = {
  async getRequests(
    propertyId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<MaintenanceListResponse> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    query.append("page", String(page));
    query.append("limit", String(pageSize));

    const response = await apiGet<MaintenanceListResponse>(
      `/maintenance/tenant?${query.toString()}`,
      headers,
    );

    if (!propertyId) {
      return response;
    }

    const filtered = response.data.filter((request) => request.propertyId === propertyId);
    return {
      ...response,
      data: filtered,
      pagination: {
        ...response.pagination,
        total: filtered.length,
        totalPages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / pageSize),
        hasMore: false,
        hasNextPage: false,
        hasPreviousPage: page > 1,
        nextPage: undefined,
      },
    };
  },

  async getRequest(id: string): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(`/maintenance/${id}`, headers);
    return extractMaintenanceRequest(raw);
  },

  async createRequest(request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    const raw = await apiPost<unknown>("/maintenance", request, headers);
    return extractMaintenanceRequest(raw);
  },

  async updateRequest(
    id: string,
    request: Partial<MaintenanceRequest>,
  ): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    const raw = await apiPut<unknown>(`/maintenance/${id}`, request, headers);
    return extractMaintenanceRequest(raw);
  },

  async updateStatus(
    id: string,
    status: string,
  ): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    const raw = await apiPut<unknown>(`/maintenance/${id}/status`, { status }, headers);
    return extractMaintenanceRequest(raw);
  },

  async deleteRequest(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/maintenance/${id}`, headers);
  },

  async getManagerMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>("/dashboard/maintenance", headers);
    return extractMaintenanceRequests(raw);
  },

  async getTenantMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const res = await this.getRequests(undefined, 1, 100);
    return res.data;
  },

  async updateMaintenanceRequest(
    id: string,
    request: Partial<MaintenanceRequest>,
  ): Promise<MaintenanceRequest> {
    return this.updateRequest(id, request);
  },

  async createMaintenanceRequest(
    request: Partial<MaintenanceRequest>,
  ): Promise<MaintenanceRequest> {
    return this.createRequest(request);
  },
};
