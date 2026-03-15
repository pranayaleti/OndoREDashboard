/**
 * Maintenance API client
 */

import {
  MaintenanceRequest,
} from "@ondo/types";
import { apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "../http";

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
    return apiGet<MaintenanceRequest>(`/maintenance/${id}`, headers);
  },

  async createRequest(request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiPost<MaintenanceRequest>("/maintenance", request, headers);
  },

  async updateRequest(
    id: string,
    request: Partial<MaintenanceRequest>,
  ): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiPut<MaintenanceRequest>(`/maintenance/${id}`, request, headers);
  },

  async updateStatus(
    id: string,
    status: string,
  ): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiPut<MaintenanceRequest>(`/maintenance/${id}/status`, { status }, headers);
  },

  async deleteRequest(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/maintenance/${id}`, headers);
  },

  async getManagerMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const headers = getAuthHeaders();
    return apiGet<MaintenanceRequest[]>("/dashboard/maintenance", headers);
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
